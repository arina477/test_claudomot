10. B-5 verify runs the exact CI commands, full lint and full test suite, not a subset, before B-6 review.
   Why: A subset skipping CI-identical lint or tests lets failures escape to C-1 as post-merge fixes.
