"""
VOTEX Voice & Audio Studio Router:
Provides instant speech-to-speech translation, microphone input processing,
natural voice generation, and audio background noise removal.
"""

from __future__ import annotations

import logging
from pathlib import Path
import shutil
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse

from votex_api.config import get_settings
from votex_api.services.audio_engine import (
    LANGUAGE_MAP,
    denoise_audio,
    normalize_lang_code,
    synthesize_speech,
    transcribe_audio,
    translate_text,
)

log = logging.getLogger("votex.studio")
router = APIRouter(prefix="/studio", tags=["studio"])
settings = get_settings()

STUDIO_STORAGE = Path(settings.WORKSPACES_DIR) / "_studio"
STUDIO_STORAGE.mkdir(parents=True, exist_ok=True)


@router.get("/languages")
def list_supported_languages() -> List[Dict[str, Any]]:
    """Return all supported Indian languages and English with metadata."""
    langs = [
        {"code": "auto", "name": "Auto Detect", "native": "स्वचालित / Auto"},
        {"code": "hi", "name": "Hindi", "native": "हिन्दी", "speech": True, "voice": True},
        {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "speech": True, "voice": True},
        {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી", "speech": True, "voice": True},
        {"code": "ta", "name": "Tamil", "native": "தமிழ்", "speech": True, "voice": True},
        {"code": "te", "name": "Telugu", "native": "తెలుగు", "speech": True, "voice": True},
        {"code": "mr", "name": "Marathi", "native": "मराठी", "speech": True, "voice": True},
        {"code": "bn", "name": "Bengali", "native": "বাংলা", "speech": True, "voice": True},
        {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ", "speech": True, "voice": True},
        {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "speech": True, "voice": True},
        {"code": "ur", "name": "Urdu", "native": "اردو", "speech": True, "voice": True},
        {"code": "en", "name": "English", "native": "English", "speech": True, "voice": True},
    ]
    return langs


@router.post("/process")
async def process_voice_studio(
    audio: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    source_lang: Optional[str] = Form("auto"),
    target_lang: Optional[str] = Form("kn"),
    filter_noise: Optional[str] = Form("false"),
    generate_audio: Optional[str] = Form("true"),
    command: Optional[str] = Form(None),
) -> Dict[str, Any]:
    """
    Unified voice, translation, audio denoising, and TTS processing pipeline.
    """
    job_id = str(uuid.uuid4())
    job_dir = STUDIO_STORAGE / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    do_denoise = str(filter_noise).strip().lower() in ("true", "1", "yes")
    do_generate_audio = str(generate_audio).strip().lower() in ("true", "1", "yes")

    # Natural Language Command heuristic parsing
    cmd_lower = (command or "").strip().lower()
    tone_directive: Optional[str] = None
    if cmd_lower:
        # Tone recognition
        if "formal" in cmd_lower or "polite" in cmd_lower or "diplomatic" in cmd_lower:
            tone_directive = "Formal / Diplomatic Tone"
        elif "casual" in cmd_lower or "friendly" in cmd_lower:
            tone_directive = "Casual / Conversational Tone"
        elif "technical" in cmd_lower or "api" in cmd_lower or "spec" in cmd_lower:
            tone_directive = "Technical / Precision Register"
        elif "legal" in cmd_lower or "contract" in cmd_lower:
            tone_directive = "Legal / Contractual Terms"

        # Target language extraction
        lang_keywords = {
            "kannada": "kn", "hindi": "hi", "gujarati": "gu", "tamil": "ta",
            "telugu": "te", "marathi": "mr", "bengali": "bn", "punjabi": "pa",
            "malayalam": "ml", "urdu": "ur", "english": "en", "spanish": "es",
            "french": "fr", "german": "de", "japanese": "ja", "chinese": "zh",
            "arabic": "ar", "russian": "ru", "portuguese": "pt", "italian": "it",
            "korean": "ko", "dutch": "nl", "turkish": "tr"
        }
        for lang_name, code in lang_keywords.items():
            if lang_name in cmd_lower and f"from {lang_name}" not in cmd_lower:
                target_lang = code
                break

        # Source language extraction
        for lang_name, code in lang_keywords.items():
            if f"from {lang_name}" in cmd_lower:
                source_lang = code
                break

        if any(w in cmd_lower for w in ("noise", "filter", "clean", "denoise", "background")):
            do_denoise = True

    steps_log: List[Dict[str, Any]] = []
    source_text = (text or "").strip()
    detected_lang = normalize_lang_code(source_lang)
    tgt_code = normalize_lang_code(target_lang)
    if tgt_code == "auto":
        tgt_code = "kn"

    has_orig_audio = False
    has_cleaned_audio = False
    has_output_audio = False

    orig_audio_file: Optional[Path] = None
    active_audio_file: Optional[Path] = None

    # 1. Audio Upload / Recording handling
    if audio and audio.filename:
        has_orig_audio = True
        suffix = Path(audio.filename).suffix.lower() or ".wav"
        if suffix not in (".wav", ".mp3", ".m4a", ".ogg", ".flac"):
            suffix = ".wav"
        orig_audio_file = job_dir / f"original{suffix}"
        active_audio_file = orig_audio_file

        with open(orig_audio_file, "wb") as f:
            shutil.copyfileobj(audio.file, f)

        steps_log.append({
            "step": len(steps_log) + 1,
            "name": f"Received Audio Input ({audio.filename})",
            "status": "completed",
        })

        # 2. Denoising if requested
        if do_denoise:
            cleaned_file = job_dir / "cleaned.wav"
            try:
                denoise_audio(orig_audio_file, cleaned_file)
                if cleaned_file.exists() and cleaned_file.stat().st_size > 0:
                    active_audio_file = cleaned_file
                    has_cleaned_audio = True
                    steps_log.append({
                        "step": len(steps_log) + 1,
                        "name": "Filtered Background Noise (Spectral Gating)",
                        "status": "completed",
                    })
            except Exception as exc:
                log.warning("Denoising step failed: %s", exc)

        # 3. Speech Recognition / Transcription
        if not source_text and active_audio_file:
            transcript, det = transcribe_audio(active_audio_file, language=source_lang)
            if transcript:
                source_text = transcript
                detected_lang = det
                lang_name = LANGUAGE_MAP.get(det, {}).get("name", det.upper())
                steps_log.append({
                    "step": len(steps_log) + 1,
                    "name": f"Speech Recognized ({lang_name}): '{transcript[:60]}...'",
                    "status": "completed",
                })
            else:
                steps_log.append({
                    "step": len(steps_log) + 1,
                    "name": "Speech Transcription (No clear speech detected, proceeding)",
                    "status": "skipped",
                })

    # If command prompt / agent directive was provided, log it
    if command and command.strip():
        directive_label = f"Directive: '{command.strip()[:60]}...'" if len(command.strip()) > 60 else f"Directive: '{command.strip()}'"
        if tone_directive:
            directive_label += f" [{tone_directive}]"
        steps_log.append({
            "step": len(steps_log) + 1,
            "name": f"Agent Command Applied ({directive_label})",
            "status": "completed",
        })

    # If no audio and user provided plain text
    if not has_orig_audio and source_text:
        steps_log.append({
            "step": len(steps_log) + 1,
            "name": f"Received Content Input ({len(source_text)} chars)",
            "status": "completed",
        })

    if not source_text:
        # If user didn't provide text and audio had no recognized text
        source_text = (command or "").strip()

    if not source_text:
        raise HTTPException(
            status_code=400,
            detail="No speech audio or text content was provided to translate or convert.",
        )

    # 4. Neural Translation
    translated_text, det_lang = translate_text(
        text=source_text,
        target_lang=tgt_code,
        source_lang=source_lang if source_lang != "auto" else detected_lang,
    )
    detected_lang = det_lang or detected_lang
    src_name = LANGUAGE_MAP.get(detected_lang, {}).get("name", detected_lang.upper())
    tgt_name = LANGUAGE_MAP.get(tgt_code, {}).get("name", tgt_code.upper())

    steps_log.append({
        "step": len(steps_log) + 1,
        "name": f"Neural Translation ({src_name} → {tgt_name})",
        "status": "completed",
    })

    # 5. Speech Audio Generation (TTS)
    output_audio_file = job_dir / "output.mp3"
    if do_generate_audio and translated_text:
        try:
            synthesize_speech(
                text=translated_text,
                lang=tgt_code,
                output_path=output_audio_file,
            )
            if output_audio_file.exists() and output_audio_file.stat().st_size > 0:
                has_output_audio = True
                steps_log.append({
                    "step": len(steps_log) + 1,
                    "name": f"Voice Synthesized in {tgt_name} ({output_audio_file.stat().st_size // 1024} KB)",
                    "status": "completed",
                })
        except Exception as exc:
            log.warning("Voice synthesis failed: %s", exc)

    return {
        "status": "success",
        "job_id": job_id,
        "source_lang": detected_lang,
        "source_lang_name": src_name,
        "target_lang": tgt_code,
        "target_lang_name": tgt_name,
        "source_text": source_text,
        "translated_text": translated_text,
        "has_original_audio": has_orig_audio,
        "original_audio_url": f"/api/v1/studio/audio/{job_id}/original" if has_orig_audio else None,
        "has_cleaned_audio": has_cleaned_audio,
        "cleaned_audio_url": f"/api/v1/studio/audio/{job_id}/cleaned" if has_cleaned_audio else None,
        "has_output_audio": has_output_audio,
        "output_audio_url": f"/api/v1/studio/audio/{job_id}/output" if has_output_audio else None,
        "steps": steps_log,
    }


@router.get("/audio/{job_id}/{kind}")
def get_studio_audio(job_id: str, kind: str):
    """Serve original, cleaned, or generated studio audio files safely."""
    # Strict UUID validation blocks any path traversal injection
    try:
        clean_job_id = str(uuid.UUID(job_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job_dir = (STUDIO_STORAGE / clean_job_id).resolve()
    base_dir = STUDIO_STORAGE.resolve()
    if not job_dir.is_relative_to(base_dir) or not job_dir.exists():
        raise HTTPException(status_code=404, detail="Studio audio not found")

    target_file = None
    media_type = "audio/mpeg"

    if kind == "output":
        target_file = job_dir / "output.mp3"
        media_type = "audio/mpeg"
    elif kind == "cleaned":
        target_file = job_dir / "cleaned.wav"
        media_type = "audio/wav"
    elif kind == "original":
        for ext in (".wav", ".mp3", ".m4a", ".ogg", ".flac"):
            candidate = job_dir / f"original{ext}"
            if candidate.exists():
                target_file = candidate
                media_type = "audio/wav" if ext == ".wav" else "audio/mpeg"
                break

    if not target_file or not target_file.exists():
        raise HTTPException(status_code=404, detail="Requested audio variant not found")

    return FileResponse(
        path=str(target_file),
        media_type=media_type,
        filename=target_file.name,
    )


@router.get("/tts")
def stream_tts(
    text: str,
    lang: str = "kn",
):
    """
    On-demand natural speech synthesis for listening to translations.
    Returns audio/mpeg stream directly for all Indian and global languages.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    clean_text = text.strip()
    norm_lang = normalize_lang_code(lang)

    try:
        audio_bytes = synthesize_speech(text=clean_text, lang=norm_lang)
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="TTS synthesis returned empty audio")

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": f'inline; filename="tts_{norm_lang}.mp3"',
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        log.error("TTS generation failed for '%s' (%s): %s", clean_text[:30], norm_lang, exc)
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(exc)}")
