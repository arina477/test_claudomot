10. B-5 verify runs the exact CI commands, full lint and full test suite, not a subset, before B-6 review.
   Why: A subset missing the CI-identical lint or tests lets failures reach C-1 as post-merge fixes.
