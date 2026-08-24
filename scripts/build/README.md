# Historical build scripts

This directory preserves the one-off generators used for previously delivered
decks, reports, booth media, and proposal versions. It is not part of the current
development environment. Many scripts intentionally retain the original local
source paths so the provenance of a delivered artifact is auditable.

Supported commands live at the repository root:

- `make setup`
- `make check`
- `make serve`
- `make docs`
- `make shots`

Do not extend a historical generator for new work. Add a current, relative-path
builder under `scripts/`, declare its dependencies in `requirements-dev.txt`,
and register every derived document in `scripts/doc-manifest.json`.
