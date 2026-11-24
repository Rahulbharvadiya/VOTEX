"""Unit tests for file validator and magic byte checking."""

import pytest
from fastapi import HTTPException
from votex_api.services.file_validator import sanitize_filename, verify_magic_bytes


def test_sanitize_filename():
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("my audio! file #1.wav") == "my audio_ file _1.wav"
    assert sanitize_filename("") == "file"


def test_verify_magic_bytes_valid():
    # PDF
    assert verify_magic_bytes(b"%PDF-1.4 sample content", ".pdf") == "application/pdf"
    # PNG
    assert verify_magic_bytes(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", ".png") == "image/png"
    # WAV
    assert verify_magic_bytes(b"RIFF\x24\x00\x00\x00WAVEfmt ", ".wav") == "audio/wav"
    # UTF-8 Text
    assert verify_magic_bytes("नमस्ते दुनिया".encode("utf-8"), ".txt") == "text/plain"


def test_verify_magic_bytes_spoofed():
    # Exe disguised as wav
    with pytest.raises(HTTPException) as exc:
        verify_magic_bytes(b"MZ\x90\x00this is an exe file", ".wav")
    assert exc.value.status_code == 422
