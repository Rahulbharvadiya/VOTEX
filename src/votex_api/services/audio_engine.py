"""
VOTEX Audio Engine: High-performance Speech-to-Text, Neural Translation,
Text-to-Speech (TTS), and Background Noise Filtering for Indian Languages.
"""

from __future__ import annotations

import io
import json
import logging
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Tuple
import urllib.parse
import urllib.request
import wave

import numpy as np
import scipy.io.wavfile as wavfile
import noisereduce as nr
import speech_recognition as sr

log = logging.getLogger("votex.audio_engine")

# Canonical language metadata mapping
LANGUAGE_MAP: Dict[str, Dict[str, str]] = {
    # 22 Official Scheduled Indian Languages + Regional
    "hi": {"name": "Hindi", "bcp47": "hi-IN", "tts": "hi"},
    "kn": {"name": "Kannada", "bcp47": "kn-IN", "tts": "kn"},
    "gu": {"name": "Gujarati", "bcp47": "gu-IN", "tts": "gu"},
    "ta": {"name": "Tamil", "bcp47": "ta-IN", "tts": "ta"},
    "te": {"name": "Telugu", "bcp47": "te-IN", "tts": "te"},
    "mr": {"name": "Marathi", "bcp47": "mr-IN", "tts": "mr"},
    "bn": {"name": "Bengali", "bcp47": "bn-IN", "tts": "bn"},
    "pa": {"name": "Punjabi", "bcp47": "pa-IN", "tts": "pa"},
    "ml": {"name": "Malayalam", "bcp47": "ml-IN", "tts": "ml"},
    "ur": {"name": "Urdu", "bcp47": "ur-IN", "tts": "ur"},
    "or": {"name": "Odia", "bcp47": "or-IN", "tts": "or"},
    "as": {"name": "Assamese", "bcp47": "as-IN", "tts": "as"},
    "sa": {"name": "Sanskrit", "bcp47": "sa-IN", "tts": "sa"},
    "ne": {"name": "Nepali", "bcp47": "ne-NP", "tts": "ne"},
    "sd": {"name": "Sindhi", "bcp47": "sd-IN", "tts": "sd"},
    "ks": {"name": "Kashmiri", "bcp47": "ks-IN", "tts": "ks"},
    "kok": {"name": "Konkani", "bcp47": "kok-IN", "tts": "kok"},
    "mai": {"name": "Maithili", "bcp47": "mai-IN", "tts": "mai"},
    "doi": {"name": "Dogri", "bcp47": "doi-IN", "tts": "doi"},
    "brx": {"name": "Bodo", "bcp47": "brx-IN", "tts": "brx"},
    "sat": {"name": "Santali", "bcp47": "sat-IN", "tts": "sat"},
    "mni": {"name": "Manipuri", "bcp47": "mni-IN", "tts": "mni"},
    "bho": {"name": "Bhojpuri", "bcp47": "bho-IN", "tts": "bho"},

    # Global Languages
    "en": {"name": "English", "bcp47": "en-US", "tts": "en"},
    "es": {"name": "Spanish", "bcp47": "es-ES", "tts": "es"},
    "fr": {"name": "French", "bcp47": "fr-FR", "tts": "fr"},
    "de": {"name": "German", "bcp47": "de-DE", "tts": "de"},
    "it": {"name": "Italian", "bcp47": "it-IT", "tts": "it"},
    "pt": {"name": "Portuguese", "bcp47": "pt-PT", "tts": "pt"},
    "ru": {"name": "Russian", "bcp47": "ru-RU", "tts": "ru"},
    "ja": {"name": "Japanese", "bcp47": "ja-JP", "tts": "ja"},
    "zh": {"name": "Chinese", "bcp47": "zh-CN", "tts": "zh-CN"},
    "ar": {"name": "Arabic", "bcp47": "ar-SA", "tts": "ar"},
}


def normalize_lang_code(code: Optional[str]) -> str:
    """Normalize language name or code to two-letter ISO 639-1 code."""
    if not code:
        return "auto"
    c = code.strip().lower()
    if "-" in c:
        prefix = c.split("-")[0]
        if prefix in LANGUAGE_MAP:
            return prefix
    if c in LANGUAGE_MAP:
        return c
    for k, v in LANGUAGE_MAP.items():
        if c == v["name"].lower() or c == v.get("bcp47", "").lower():
            return k
    # Word heuristics
    if "hindi" in c:
        return "hi"
    if "kannada" in c:
        return "kn"
    if "gujarat" in c:
        return "gu"
    if "tamil" in c:
        return "ta"
    if "telugu" in c:
        return "te"
    if "marathi" in c:
        return "mr"
    if "bengali" in c:
        return "bn"
    if "punjabi" in c:
        return "pa"
    if "malayalam" in c:
        return "ml"
    if "urdu" in c:
        return "ur"
    if "odia" in c or "oriya" in c:
        return "or"
    if "assamese" in c:
        return "as"
    if "sanskrit" in c:
        return "sa"
    if "nepali" in c:
        return "ne"
    if "english" in c:
        return "en"
    if "spanish" in c:
        return "es"
    if 2 <= len(c) <= 6:
        return c
    return "auto"


def translate_text(
    text: str, target_lang: str = "kn", source_lang: str = "auto"
) -> Tuple[str, str]:
    """
    Translates text between languages with high accuracy.
    Returns (translated_text, detected_source_lang).
    """
    if not text or not text.strip():
        return "", source_lang

    tgt = normalize_lang_code(target_lang)
    src = normalize_lang_code(source_lang)
    if tgt == "auto":
        tgt = "kn"

    encoded = urllib.parse.quote(text.strip())
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={src}&tl={tgt}&dt=t&q={encoded}"

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            translated = "".join(
                [part[0] for part in data[0] if part and len(part) > 0 and part[0]]
            )
            detected = data[2] if len(data) > 2 and isinstance(data[2], str) else src
            return translated, detected
    except Exception as exc:
        log.error("Translation failed: %s", exc)
        # Fallback if network or error
        return text, src


def synthesize_speech(text: str, lang: str = "kn", output_path: Optional[Path] = None) -> bytes:
    """
    Synthesizes natural speech audio in the given Indian language or English.
    Returns audio bytes and optionally writes to output_path.
    """
    if not text or not text.strip():
        return b""

    l_code = normalize_lang_code(lang)
    tts_lang = LANGUAGE_MAP.get(l_code, {}).get("tts", l_code)

    # Chunk text to stay within TTS character limits (~150 chars per phrase)
    words = text.split()
    chunks: List[str] = []
    curr: List[str] = []

    for w in words:
        candidate = " ".join(curr + [w])
        if len(candidate) < 140:
            curr.append(w)
        else:
            if curr:
                chunks.append(" ".join(curr))
            curr = [w]
    if curr:
        chunks.append(" ".join(curr))

    if not chunks:
        chunks = [text[:140]]

    audio_bytes = bytearray()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    for chunk in chunks:
        if not chunk.strip():
            continue
        encoded = urllib.parse.quote(chunk.strip())
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={tts_lang}&q={encoded}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                audio_bytes.extend(resp.read())
        except Exception as exc:
            log.warning("TTS chunk '%s' failed: %s", chunk[:20], exc)

    result = bytes(audio_bytes)
    if output_path and result:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(result)

    return result


def denoise_audio(input_path: Path, output_path: Path) -> Path:
    """
    Filters background noise, room reverberation, and static hiss from an audio file.
    Saves clean 16-bit WAV file to output_path.
    """
    try:
        sr_rate, data = wavfile.read(str(input_path))
        orig_shape = data.shape
        orig_dtype = data.dtype

        # Convert to float32 in [-1.0, 1.0]
        if orig_dtype == np.int16:
            audio_float = data.astype(np.float32) / 32768.0
        elif orig_dtype == np.int32:
            audio_float = data.astype(np.float32) / 2147483648.0
        elif orig_dtype == np.uint8:
            audio_float = (data.astype(np.float32) - 128.0) / 128.0
        else:
            audio_float = data.astype(np.float32)

        # Handle stereo by averaging or processing channels
        if len(orig_shape) > 1 and orig_shape[1] > 1:
            # Process multi-channel
            cleaned_channels = []
            for ch in range(orig_shape[1]):
                ch_cleaned = nr.reduce_noise(
                    y=audio_float[:, ch],
                    sr=sr_rate,
                    prop_decrease=0.85,
                    stationary=True,
                )
                cleaned_channels.append(ch_cleaned)
            cleaned_float = np.column_stack(cleaned_channels)
        else:
            cleaned_float = nr.reduce_noise(
                y=audio_float,
                sr=sr_rate,
                prop_decrease=0.85,
                stationary=True,
            )

        # Clip and convert back to int16
        cleaned_int16 = np.clip(cleaned_float * 32767.0, -32768.0, 32767.0).astype(np.int16)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        wavfile.write(str(output_path), sr_rate, cleaned_int16)
        return output_path
    except Exception as exc:
        log.error("Denoising failed: %s; copying original", exc)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(input_path.read_bytes())
        return output_path


def transcribe_audio(
    audio_path: Path, language: Optional[str] = None
) -> Tuple[str, str]:
    """
    Transcribes spoken voice audio to text using SpeechRecognition.
    Returns (transcript_text, detected_language).
    """
    recognizer = sr.Recognizer()
    lang_code = normalize_lang_code(language)
    bcp47 = LANGUAGE_MAP.get(lang_code, {}).get("bcp47", "hi-IN") if lang_code != "auto" else "hi-IN"

    # Candidate language codes to try if auto
    candidates = [bcp47]
    if lang_code == "auto":
        candidates = ["hi-IN", "gu-IN", "kn-IN", "ta-IN", "te-IN", "mr-IN", "en-IN"]

    try:
        with sr.AudioFile(str(audio_path)) as source:
            # Adjust for ambient noise and record
            recognizer.adjust_for_ambient_noise(source, duration=0.3)
            audio_data = recognizer.record(source)

        for cand in candidates:
            try:
                text = recognizer.recognize_google(audio_data, language=cand)
                if text and text.strip():
                    det_code = cand.split("-")[0]
                    return text.strip(), det_code
            except Exception:
                continue

        return "", lang_code
    except Exception as exc:
        log.error("Transcription failed: %s", exc)
        return "", lang_code
