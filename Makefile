.PHONY: test lint dev-api dev-ui seed clean

test:
	PYTHONPATH=src pytest tests/unit tests/integration -v

lint:
	ruff check src tests

dev-api:
	uvicorn votex_api.main:app --host 0.0.0.0 --port 8000 --reload

dev-ui:
	cd frontend && npm run dev

seed:
	PYTHONPATH=src python scripts/seed_dev.py

build-ui:
	cd frontend && npm run build
