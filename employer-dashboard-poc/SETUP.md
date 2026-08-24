# Development environment setup

This is the clean-clone setup for the standalone
`jangwookimbusiness-dev/iclo-us-employee-dashboard` repository.

## Prerequisites

- Git with push access for maintainers
- Python **3.14.7** (`python3.14` on PATH)
- Google Chrome or Chromium
- GNU Make
- GitHub CLI (`gh`) for Issue/PR work
- Optional: Claude Code, Codex, and gstack for the documented cross-model workflow

On macOS with Homebrew:

```bash
brew install python@3.14 gh
```

Chrome may be installed from its official package. On Ubuntu, use the Chrome or
Chromium package supplied for your distribution.

## Clean clone

```bash
git clone https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard.git
cd iclo-us-employee-dashboard
make setup
make check
make install-hooks
make serve
```

Open `http://localhost:8000/`. Do not work from
`employer-dashboard-poc/`; the shipped application and supported commands are at
the repository root.

## GitHub access

```bash
gh auth status
gh auth login -h github.com
```

Work starts from a GitHub Issue and a feature branch. `main` is protected; direct
pushes and deployments that bypass `gates` are not part of the workflow.

## Optional agent tools

Install agent tooling from its own maintained instructions. It is not a runtime
or test dependency of this repository. After installation, start the agent from
the repository root so `AGENTS.md` and `CLAUDE.md` govern `index.html` and
`app.html`.

## Environment verification

- [ ] `python3.14 --version` reports 3.14.7
- [ ] `make setup` creates `.venv` and installs the exact versions in `requirements-dev.txt`
- [ ] `make check` passes all ten gates
- [ ] `gh auth status` succeeds for maintainers
- [ ] `make serve` opens the two demo surfaces over HTTP
- [ ] `make install-hooks` installs the fast local guard

## Document builds

`make docs` additionally needs gstack's `make-pdf` binary. The builder searches
Codex, Claude, and shared gstack locations; `MAKE_PDF_BIN=/absolute/path/to/pdf`
overrides discovery. CI validates document freshness but does not regenerate PDFs.
