# Artifact policy

Git is the source of truth for application code, contracts, documentation
sources, deterministic fixtures, and the managed derived documents listed in
`scripts/doc-manifest.json`.

## What belongs in Git

- HTML, Python, shell, YAML, Markdown, and other reviewable source files
- small deterministic fixtures needed by required tests
- current PDFs or screenshots that must be reviewed with their source and are
  covered by the document-freshness manifest

## What belongs outside Git

- handoff ZIP archives and duplicated delivery bundles
- intermediate renders and replaceable build output
- any individual file larger than **15 MiB**

Publish those files as a GitHub Release asset or in an approved document store.
Keep a small Markdown record in Git with its immutable checksum, owner, purpose,
retention period, and external link. Do not use a mutable link as the only
record of a delivered artifact.

`scripts/check-package-consistency.py` rejects tracked files above the 15 MiB
limit. When a managed document source changes, run `make docs`; CI verifies the
derived artifact hashes but does not regenerate them.

Architecture diagrams use the `.mmd` file as their source of truth. Keep the
matching `.svg`, `.png`, and `.excalidraw` review artifacts together under
`diagrams/`, and re-render all three whenever the Mermaid source changes. These
files are not yet rebuilt by `make docs` or covered by `doc-manifest.json`, so a
PR changing one of the four must change and visually verify the complete set.

## Existing history

As measured on 2026-08-25, `.git` is about 168 MiB, `output/` is about 81 MiB,
and 23 working-tree artifacts exceed 1 MiB. Several large PDFs have many
historical versions. Do not rewrite public history casually: archive a mirror,
inventory release links and checksums, coordinate the cutover, then use a
reviewed `git filter-repo` migration with an explicit rollback plan.
