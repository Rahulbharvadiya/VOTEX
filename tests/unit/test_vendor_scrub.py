"""
Vendor scrubbing unit test for VOTEX.
Verifies that no user-facing modules, prompt templates, report outputs, or tool
descriptions leak provider branding.
"""

from pathlib import Path
import ast
import re
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def test_system_prompt_vendor_scrub():
    prompt_file = REPO_ROOT / "src" / "bodhan_agent" / "prompts" / "system.txt"
    assert prompt_file.exists()
    content = prompt_file.read_text(encoding="utf-8")
    assert "bodhan" not in content.lower(), f"Found vendor name in {prompt_file}"


def test_report_generator_vendor_scrub():
    report_file = REPO_ROOT / "src" / "bodhan_agent" / "report.py"
    assert report_file.exists()
    content = report_file.read_text(encoding="utf-8")
    assert "bodhan task agent" not in content.lower(), f"Found vendor name in {report_file}"


def test_mcp_tool_descriptions_vendor_scrub():
    tools_dir = REPO_ROOT / "src" / "bodhan_mcp" / "tools"
    assert tools_dir.exists()
    for tool_file in tools_dir.glob("*.py"):
        tree = ast.parse(tool_file.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Module)):
                doc = ast.get_docstring(node)
                if doc:
                    assert "bodhan" not in doc.lower(), f"Found vendor in docstring of {tool_file.name}:{getattr(node, 'name', 'module')}: {doc}"


def test_api_code_neutral_branding():
    api_dir = REPO_ROOT / "src" / "votex_api"
    if not api_dir.exists():
        pytest.skip("votex_api not created yet")

    # Exclude sanitizer/logging_config (which define scrubbing regexes) and config.py (upstream URL)
    exempt_files = {"logging_config.py", "sanitizer.py", "config.py"}

    for py_file in api_dir.rglob("*.py"):
        if py_file.name in exempt_files:
            continue
        content = py_file.read_text(encoding="utf-8")
        cleaned = re.sub(r'BODHAN_[A-Z0-9_]+', '', content)
        cleaned = re.sub(r'bodhan_core|bodhan_agent|bodhan_mcp', '', cleaned)
        assert "bodhan" not in cleaned.lower(), f"Found vendor string in API module {py_file.name}"
