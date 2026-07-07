15. Wrap a multi-step mutation that must be all-or-nothing in a DB transaction, not separate auto-committed statements.
   Why: Auto-committed statements can partly apply, leaving a half-scrubbed or inconsistent record.
