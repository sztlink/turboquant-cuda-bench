# Privacy audit — evidence-utilization phase package — 2026-05-17

Audit scope: files promoted into this package only.

Promoted material contains:

- Aggregate JSON summaries.
- Compact `RESULTS.md` files.
- Synthetic fixture scripts.
- Controller sequence log and done marker.

Intentionally omitted:

- `summary.jsonl` raw per-request rows.
- Raw prompt / answer traces.
- Discord-derived chunks or handles.

Known string caveat: fixture scripts use labels such as `SECRET VALUE` to describe synthetic target fields. These are not credentials or private data.

Safe to treat this package as publicable with normal caveats: synthetic staging, not benchmark claim, not model/global/service judgment.
