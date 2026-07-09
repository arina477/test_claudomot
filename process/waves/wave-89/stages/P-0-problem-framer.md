verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Premise verified live against apps/web/src/pages/ProfilePage.tsx (read in full). The page is
  wrapped in FullPageScroll (h-dvh overflow-y-auto — the real scroll container added wave-81), and
  NONE of its five save handlers (display name, username, avatar, academic identity, accent) call
  scrollIntoView or .focus() on a failed-validation save. useRef is imported but bound only to
  avatarInputRef (the file input); there is no ref system on any text/select input to hook focus
  into. So a save that fails validation on a field scrolled out of view leaves that field
  off-screen and unfocused — the gap is real, NOT already shipped by a later wave. Symptom-vs-cause:
  clean — the symptom (unreachable errored field) and the cause (no post-submit focus/scroll
  management) are the same layer (client form UX), and the seed's fix targets that cause directly.
  No wrong-layer, demo-path, premature-abstraction, or scope-creep antipattern matched. The framing
  is sound; the one refinement below is scope-tightening, not a reframe.
proposed_reframe: |
  (Not a REFRAME — PROCEED. Recorded here as the minimal-correct a11y scope for P-1/P-2 to lock,
  since the seed prose under-specifies the multi-form reality of this page.)

  MINIMAL-CORRECT SCOPE — the gap is live; scroll+focus-first-errored-field IS the right fix, with
  three honesty constraints:

  1. Per-form, not page-global. ProfilePage has FIVE independent <form>s, each with its own submit
     button and its own error state. "First errored field" means first-in-DOM-order invalid field
     WITHIN the form being submitted — not the first errored field on the whole page. Framing the
     fix as one page-level scroll target would be wrong.

  2. The realistic trigger is the academic-identity form. handleAcademicSave early-returns on
     academicClientError (over-length pronouns/bio/institution/program/academicYear) without
     surfacing WHICH field failed or moving to it — that form is long enough to scroll a field out
     of view, and its error is a single shared string with no per-field association. The username
     form is short and single-field (its aria-invalid/aria-describedby wiring already exists and is
     correct), so it is a near-no-op for this fix; display-name/avatar/accent have no blocking
     client-validation path. Do NOT gold-plate all five forms uniformly — the load-bearing case is
     the academic form.

  3. Focus management, not mouse-only scroll. The fix MUST programmatically .focus() the first
     invalid field (which scrolls it into view natively and serves keyboard/SR users), NOT merely
     scrollIntoView (mouse-only, cargo-culted). Reuse the EXISTING error-surfacing pattern rather
     than inventing a new one: username already has aria-invalid + aria-describedby → role="alert"
     error node; extend that same shape to the academic fields so the focused field is announced.

  OUT OF SCOPE (do not expand into): a full form-a11y overhaul, a generic validation framework, or
  converting the shared single academicClientError into a per-field error map beyond what focus
  targeting requires. Per-field targeting needs a ref per academic input + knowing which field
  failed; that is the necessary minimum, not a knob-adding abstraction.
escalation_reason: |
  (n/a)
sibling_visible: false
