# P-2 Spec (pointer) — wave-66
Source of truth: `tasks` row 6018bdee-1b99-47b2-8235-b3786c29c2d5 description (YAML+---+prose). single-spec, design_gap_flag=false.
ACs: (1) offline/reconnecting + detail-error → neutral offline empty-state copy; (2) online + detail-error → error copy preserved (no false comfort); (3) presentation-only, reuse useConnectionState, no logic/API/schema change; (4) update shell-components.test.tsx (/couldn't load channels/i) to assert both branches.
Target: apps/web/src/shell/ChannelSidebar.tsx:335-341 (detailStatus==='error' branch) gated on apps/web/src/shell/useConnectionState.ts.
