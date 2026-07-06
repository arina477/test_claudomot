12. Test a component's success callback through its real parent caller, not the component rendered in isolation.
   Why: An isolated test injecting the prop passes while the caller never wires it, no-oping live.
