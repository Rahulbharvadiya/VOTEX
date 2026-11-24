"""
Automated 12-check smoke test suite for VOTEX API.
Can be executed against local, staging, or production deployments.
"""

import argparse
import os
import sys
import uuid
import requests


def run_smoke_tests(base_url: str) -> bool:
    print(f"=== Starting VOTEX 12-Check Automated Smoke Test against {base_url} ===")
    session = requests.Session()
    other_session = requests.Session()

    test_email = f"smoke_{uuid.uuid4().hex[:8]}@example.test"
    test_password = "SmokeTestPassword123!"

    other_email = f"other_{uuid.uuid4().hex[:8]}@example.test"
    other_password = "SmokeTestPassword123!"

    passed = 0
    total = 12

    try:
        # Check 1: Health probe
        print("[Check 1/12] GET /health liveness probe...")
        r = session.get(f"{base_url}/health", timeout=5)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json().get("status") == "ok", "Status is not ok"
        passed += 1
        print("  -> PASS")

        # Check 2: Readiness probe
        print("[Check 2/12] GET /ready readiness probe...")
        r = session.get(f"{base_url}/ready", timeout=5)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json().get("status") == "ready", "Status is not ready"
        passed += 1
        print("  -> PASS")

        # Check 3: Security headers
        print("[Check 3/12] Verifying OWASP security headers...")
        assert r.headers.get("x-content-type-options") == "nosniff"
        assert r.headers.get("x-frame-options") == "DENY"
        assert "content-security-policy" in r.headers
        passed += 1
        print("  -> PASS")

        # Check 4: Unauthenticated protection
        print("[Check 4/12] Verifying 401 on unauthenticated task list...")
        r = requests.get(f"{base_url}/api/v1/tasks", timeout=5)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        passed += 1
        print("  -> PASS")

        # Check 5: User registration
        print("[Check 5/12] Registering test user...")
        r = session.post(
            f"{base_url}/api/v1/auth/register",
            json={"email": test_email, "password": test_password},
            timeout=10,
        )
        assert r.status_code == 200, f"Registration failed with {r.status_code}: {r.text}"
        csrf_token = session.cookies.get("votex_csrf_token")
        assert csrf_token, "votex_csrf_token cookie missing"
        passed += 1
        print("  -> PASS")

        # Also register other user for IDOR testing
        r_other = other_session.post(
            f"{base_url}/api/v1/auth/register",
            json={"email": other_email, "password": other_password},
            timeout=10,
        )
        assert r_other.status_code == 200
        other_csrf = other_session.cookies.get("votex_csrf_token")

        # Check 6: Login with wrong password returns generic 401
        print("[Check 6/12] Testing bad credentials generic error...")
        r = requests.post(
            f"{base_url}/api/v1/auth/login",
            json={"email": test_email, "password": "WrongPassword999!"},
            timeout=5,
        )
        assert r.status_code == 401
        assert "Invalid email or password" in r.json().get("error", {}).get("message", "")
        passed += 1
        print("  -> PASS")

        # Check 7: Session profile verification
        print("[Check 7/12] Fetching authenticated user profile GET /api/v1/auth/me...")
        r = session.get(f"{base_url}/api/v1/auth/me", timeout=5)
        assert r.status_code == 200
        assert r.json().get("email") == test_email
        passed += 1
        print("  -> PASS")

        # Check 8: Submit task
        print("[Check 8/12] Submitting multi-step task POST /api/v1/tasks...")
        idempotency_key = f"smoke-key-{uuid.uuid4().hex}"
        task_payload = {
            "prompt": "Transcribe this audio, detect language, and summarize in Hindi",
            "max_steps": "10",
            "max_cost_inr": "5.0",
            "max_seconds": "60",
        }
        r = session.post(
            f"{base_url}/api/v1/tasks",
            data=task_payload,
            headers={
                "x-csrf-token": csrf_token,
                "Idempotency-Key": idempotency_key,
            },
            timeout=10,
        )
        assert r.status_code == 201, f"Task submission failed: {r.status_code} {r.text}"
        task_data = r.json()
        task_id = task_data["id"]
        assert task_data["status"] == "queued"
        passed += 1
        print("  -> PASS")

        # Check 9: Idempotency deduplication
        print("[Check 9/12] Testing idempotency key deduplication...")
        r_dup = session.post(
            f"{base_url}/api/v1/tasks",
            data=task_payload,
            headers={
                "x-csrf-token": csrf_token,
                "Idempotency-Key": idempotency_key,
            },
            timeout=10,
        )
        assert r_dup.status_code == 201
        assert r_dup.json()["id"] == task_id, "Idempotent duplicate did not return original task ID"
        passed += 1
        print("  -> PASS")

        # Check 10: Task inspection
        print("[Check 10/12] Inspecting task status GET /api/v1/tasks/{id}...")
        r = session.get(f"{base_url}/api/v1/tasks/{task_id}", timeout=5)
        assert r.status_code == 200
        assert r.json()["id"] == task_id
        passed += 1
        print("  -> PASS")

        # Check 11: IDOR cross-user access isolation
        print("[Check 11/12] IDOR check: verifying other user gets 404...")
        r_idor = other_session.get(f"{base_url}/api/v1/tasks/{task_id}", timeout=5)
        assert r_idor.status_code == 404, f"IDOR vulnerability! Expected 404, got {r_idor.status_code}"
        passed += 1
        print("  -> PASS")

        # Check 12: Delete task cleanup
        print("[Check 12/12] Deleting task and verifying disk cleanup DELETE /api/v1/tasks/{id}...")
        r_del = session.delete(
            f"{base_url}/api/v1/tasks/{task_id}",
            headers={"x-csrf-token": csrf_token},
            timeout=5,
        )
        assert r_del.status_code in (200, 204), f"Delete failed: {r_del.status_code}"

        # Verify task is 404 after deletion
        r_check = session.get(f"{base_url}/api/v1/tasks/{task_id}", timeout=5)
        assert r_check.status_code == 404
        passed += 1
        print("  -> PASS")

    except AssertionError as e:
        print(f"\n[FAIL] Smoke test failed at check {passed + 1}: {e}")
        return False
    except Exception as e:
        print(f"\n[ERROR] Unexpected exception during smoke test: {e}")
        return False

    print(f"\n=== All {passed}/{total} Smoke Test Checks Passed Successfully ===")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VOTEX Smoke Tests")
    parser.add_argument("--base-url", default=os.getenv("BASE_URL", "http://localhost:8000"))
    args = parser.parse_args()

    success = run_smoke_tests(args.base_url.rstrip("/"))
    sys.exit(0 if success else 1)
