13. Pass the opaque user id, not the display username, to any prop compared for identity such as isOwn or isSelf.
   Why: A username-vs-id mismatch makes the identity check always-false, hiding owner affordances.
