CONCERN: The plan treats presence lookups as a trivial cost, applying a component designed for a limited-size list (member panel) to a potentially unbounded one (message list). This risks a performance bottleneck where a single user's status change could trigger re-renders for every visible message, degrading UI responsiveness in large, active channels.

EVIDENCE: "at each author-avatar render site (MessageList.tsx ~:1013-1020 main row, :1226/:1316 sibling variants), render `<PresenceDot>` ... with the online state read from the EXISTING presence store
