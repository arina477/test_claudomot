16. Resolve an authz or visibility check by delegating to the shared tested seam, not by re-querying membership inline.
    Why: Inline membership re-derivation can drift from the seam and open a privacy leak.
