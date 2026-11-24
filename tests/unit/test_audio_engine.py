"""Unit tests for VOTEX audio engine and studio processing."""

from pathlib import Path
import numpy as np
import scipy.io.wavfile as wavfile
import pytest

from votex_api.services.audio_engine import (
    normalize_lang_code,
    translate_text,
    synthesize_speech,
    denoise_audio,
)


def test_normalize_lang_code():
    assert normalize_lang_code("kannada") == "kn"
    assert normalize_lang_code("hindi") == "hi"
    assert normalize_lang_code("gujarati") == "gu"
    assert normalize_lang_code("tamil") == "ta"
    assert normalize_lang_code("telugu") == "te"
    assert normalize_lang_code("english") == "en"
    assert normalize_lang_code("hi-IN") == "hi"
    assert normalize_lang_code("") == "auto"
    assert normalize_lang_code(None) == "auto"


def test_translation_text():
    text = "Hello world"
    translated, det = translate_text(text, target_lang="hi", source_lang="en")
    assert translated is not None
    assert len(translated) > 0


def test_tts_speech(monkeypatch):
    # Mock network call for offline unit tests
    def mock_urlopen(req, timeout=15):
        from io import BytesIO
        class MockResp(BytesIO):
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass
        return MockResp(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")

    monkeypatch.setattr("urllib.request.urlopen", mock_urlopen)
    text = "नमस्ते"
    audio_bytes = synthesize_speech(text, lang="hi")
    assert len(audio_bytes) > 0


def test_denoise_audio(tmp_path):
    in_wav = tmp_path / "noisy.wav"
    out_wav = tmp_path / "clean.wav"

    sr = 16000
    t = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * 440 * t)
    noise = 0.1 * np.random.randn(len(t))
    audio_int16 = ((signal + noise) * 32767).astype(np.int16)

    wavfile.write(str(in_wav), sr, audio_int16)
    res = denoise_audio(in_wav, out_wav)

    assert res.exists()
    assert res.stat().st_size > 0
