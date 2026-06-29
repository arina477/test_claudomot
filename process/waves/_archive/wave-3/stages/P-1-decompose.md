# Wave 3 — P-1 Decompose — RESCOPE-AUTO-SPLIT (founder-approved, recreated)
- **Wave-3 retained (claimed [9aae8255]):** auth frontend = 6 pages (supertokens-auth-react, wired to LIVE auth backend) + verify-gating UX + basic display_name profile editing (display_name column exists).
- **Split-out sibling 2a655960 (M1, wave_id NULL → future wave):** profile customization backend + avatar (username/avatar_url/accent_color columns, profile PATCH, FilesModule + object storage + avatar upload).
```yaml
wave_type: single-spec
verdict: RESCOPE-AUTO-SPLIT (founder-approved)
claimed_task_ids: [9aae8255-34b3-4f63-bdd4-97f39cf1d842]
design_gap_flag: false
```
