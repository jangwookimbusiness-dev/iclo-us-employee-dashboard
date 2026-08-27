PYTHON_BOOTSTRAP ?= python3.14
PYTHON_VERSION := 3.14.7
VENV := .venv
PYTHON := $(VENV)/bin/python

.PHONY: help setup check check-fast serve docs install-hooks clean

help:
	@echo "make setup         Create the Python 3.14 virtual environment"
	@echo "make check         Run the same eleven CI commands as CI"
	@echo "make check-fast    Run non-browser pre-commit gates"
	@echo "make serve         Serve the demo at http://localhost:8000"
	@echo "make docs          Rebuild managed screenshots and PDFs"
	@echo "make install-hooks Install the repository pre-commit hook"

setup:
	@command -v $(PYTHON_BOOTSTRAP) >/dev/null || { echo "$(PYTHON_BOOTSTRAP) is required (see employer-dashboard-poc/SETUP.md)"; exit 1; }
	@$(PYTHON_BOOTSTRAP) -c 'import platform, sys; required="$(PYTHON_VERSION)"; actual=platform.python_version(); sys.exit(0 if actual == required else "Python %s is required; found %s" % (required, actual))'
	$(PYTHON_BOOTSTRAP) -m venv $(VENV)
	$(PYTHON) -m pip install --requirement requirements-dev.txt

check: check-fast
	$(PYTHON) test_tech_sql.py
	$(PYTHON) test_consent.py
	$(PYTHON) test_export_contract.py
	$(PYTHON) test_export_contract_cases.py
	$(PYTHON) test_fixtures.py
	$(PYTHON) test_pages_root.py
	$(PYTHON) scripts/generate_synthetic.py --check
	$(PYTHON) test_build_reads_canon.py

check-fast:
	@test -x $(PYTHON) || { echo "Run 'make setup' first"; exit 1; }
	bash employer-dashboard-poc/scripts/check-forbidden-terms.sh
	$(PYTHON) scripts/check-package-consistency.py
	$(PYTHON) test_doc_freshness.py

serve:
	bash scripts/serve.sh

docs:
	@test -x $(PYTHON) || { echo "Run 'make setup' first"; exit 1; }
	$(PYTHON) scripts/docs_build.py

install-hooks:
	bash scripts/install-hooks.sh

clean:
	@echo "Remove .venv manually if you want a fresh environment. Generated deliverables are never deleted by this target."
