4. Run the formatter check command at the wiring stage before commit, not only the test and typecheck commands.
   Why: A file committed without the formatter passes a local test run but fails the CI format gate.
