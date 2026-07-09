13. Pass an explicit commitSha to serviceInstanceDeploy; a bare call redeploys the pinned prior commit, not main HEAD.
   Why: Railway pins the last-deployed commit, so a bare call returns green SUCCESS on stale code.
