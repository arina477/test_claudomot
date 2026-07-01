7. Run the lint/import-organizer check command, not the formatter alone, before reporting a build task done.
   Why: A formatter can pass while the CI check gate rejects import ordering it never touches.
