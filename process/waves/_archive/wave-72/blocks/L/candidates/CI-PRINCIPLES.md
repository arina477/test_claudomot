11. Mark an e2e whose baseURL targets deployed prod as non-required; it verifies the deployed binary, not the branch.
   Why: A prod-baseURL e2e can pass green while the branch carries an undeployed regression.
