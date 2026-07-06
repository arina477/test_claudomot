# P-2 Spec — wave-61 (pointer)
Authoritative: tasks.description of 874bd233 (YAML head + --- + prose).
wave_type: single-spec; claimed_task_ids: [874bd233]; design_gap_flag: false; security-surface: rate-limit (T-8).
ACs: bounded @Throttle(60/60s) override on 3 DM read routes (candidates/conversations/messages); page-load burst
no longer 429s within budget; throttle right-sized not removed; non-DM-read + DM-write routes keep global 10/60s;
client bounded exponential backoff + Retry-After on 429 for DM read fetches. Contracts: no shape change (@Throttle
decorator + client fetch-retry). Corrected cause: ONE global throttler, DM reads had no override (P-0 REFRAME→PROCEED).
