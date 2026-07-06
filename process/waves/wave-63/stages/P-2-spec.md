# P-2 Spec — wave-63 (pointer, multi-spec)
Authoritative: tasks.description of SEED c5689dc5 (YAML head with `specs:` flat list of 3 blocks + --- + prose).
wave_type: multi-spec; claimed_task_ids: [c5689dc5 (substrate), 35c57942 (assignments), 42e0a265 (schedule)]; design_gap_flag: false.
Key: Dexie v3 substrate (cachedAssignments/cachedScheduledSessions + read-through helpers, reuse bundle #1) → wire AssignmentsPanel + ClassCalendar offline reads.
HIGHEST-RISK: v3 .version(3).stores() re-states ALL 5 v1+v2 tables verbatim (else dropped) + preservation test. 2ND: sessions cache keyed by serverId+window (occurrence-expanded).
