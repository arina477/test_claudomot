# Wave 41 — N-2 Seed

Seed pick + full-bundle validation for wave-42.

- **Seed:** db8e082a "Add student assignment submission (collect) backend + submit UI"
- **Siblings:** 1746f72a (educator submissions roster / collect view) + b859984b (educator return action, no grading)
- **Validation:** PASS — all 3 rows `status=todo`, `wave_id IS NULL`, `milestone_id=84e17739` (M8); both siblings `parent_task_id=db8e082a`.
- The 2 moderation follow-ups (8828484f, ca43eb12) correctly excluded (wave_id set) — assignment bundle is the clean next seed as intended.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: db8e082a-5ab3-4dc4-8aed-b9553c6b0a27"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: db8e082a-5ab3-4dc4-8aed-b9553c6b0a27
seed_task_title: "Add student assignment submission (collect) backend + submit UI"
bundled_sibling_ids: [1746f72a-b086-4d48-941f-36997cf09c54, b859984b-aa75-481c-b1e7-f6945ddb4ceb]
claimed_task_ids: [db8e082a-5ab3-4dc4-8aed-b9553c6b0a27, 1746f72a-b086-4d48-941f-36997cf09c54, b859984b-aa75-481c-b1e7-f6945ddb4ceb]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "wave-42 = M8 assignment collect/return slice."
```
