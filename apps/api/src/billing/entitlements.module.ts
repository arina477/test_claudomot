import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';

// ---------------------------------------------------------------------------
// EntitlementsModule — wave-74 M9 entitlements substrate
//
// A standalone module that resolves subscription tiers and capability caps.
// No controllers (billing is read-only substrate this wave — no endpoints).
//
// Dependency direction:
//   ServersModule imports EntitlementsModule (one-way).
//   EntitlementsModule does NOT import ServersModule → no circular dependency.
//   AppModule imports both independently (order does not matter for acyclicity).
//
// Exports EntitlementsService so any module that imports EntitlementsModule
// can inject it (currently only ServersModule).
// ---------------------------------------------------------------------------

@Module({
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
