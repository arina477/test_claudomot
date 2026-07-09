# Wave 82 — P-2 Spec (pointer)
Source: task 0e58af8e `tasks.description`. single-spec. design_gap false.
## ACs: transient 401 on ANY authed request() → single attemptRefreshingSession + retry once → no bounce; GENUINE-LOGOUT guard (refresh=false → propagate → /login); retry once only on 401; BURST-401s → one shared refresh; no 429/offline regression. Fix = the shared api-client seam (extends retryOn429). LOAD-BEARING: genuine-logout guard (T-8).
