1. CI must boot the compiled artifact and probe its health endpoint before the merge gate, not only source-level tests.
   Why: Source-run tests cannot catch dist path and config defects that crash prod at first boot.
