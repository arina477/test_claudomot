11. In a Dexie .version(N+1).stores() call, re-state every prior table verbatim; an omitted table is dropped on upgrade.
   Why: Dexie treats a table absent from a later version as a drop, irreversibly deleting its data.
