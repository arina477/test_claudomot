# Wave 39 — P-2 Spec (pointer)
**Canonical spec:** `tasks.description` of c208e91e (YAML head + `---` + prose).
**wave_type:** single-spec (ui) · **claimed_task_ids:** [c208e91e] · **design_gap_flag:** false
## ACs (copy)
1. Settings button opens a user-menu popover (was dead); aria-haspopup/expanded.
2. Menu has Profile / Privacy / Log out (role=menuitem, reuse MessageList role=menu pattern).
3. Profile → /settings/profile (avatar uploader), closes menu.
4. Privacy → /settings/privacy, closes menu.
5. Log out → SuperTokens signOut → redirect to login; protected routes then bounce.
6. Keyboard-accessible: Enter/Space open, Esc close+refocus, outside-click close, close-on-select.
7. CRUX reachability: logged-in user via UI only → button → Profile → upload avatar → renders (closes wave-38 F1).
