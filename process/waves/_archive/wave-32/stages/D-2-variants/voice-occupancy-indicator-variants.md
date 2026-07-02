# D-2 Variants — voice-occupancy-indicator

- **Staging file:** design/staging/voice-occupancy-indicator.html (19,292 bytes)
- **Generator:** /aidesigner (aidesigner.ai REST, mode=generate, streaming=false; 20,666 tokens)
- **Approach:** bounded extension of the wave-31-adopted design/voice-study-room.html — reused its exact <head> Tailwind token config + count-chip (ph-users pill, :278-281) + participant-avatar look (:289-296) + calm empty-state language (:368-384). Four stacked labeled state sections: loading (skeleton shimmer), empty ("door's open, be the first"), populated (count chip + "3 studying now" + compact avatar cluster w/ emerald presence dot + "+N" overflow), error (fail-soft "couldn't load who's here" — Join still available).
- **Validation:** all hexes are exact DESIGN-SYSTEM tokens (surface-950..500, emerald, danger, danger-text, amber) — ZERO invented hex/tokens. role="status"/aria-live present (4), avatar alt present (3), prefers-reduced-motion present, "+N" overflow present. Join primary control in every state.
- **/aidesigner warnings:** none.
