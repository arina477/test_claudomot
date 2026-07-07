import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BILLING_PROVIDER } from './billing-provider.interface';
import { BillingController } from './billing.controller';
import { EducatorToolsController } from './educator-tools.controller';
import { EntitlementGuard } from './entitlement.guard';
import { EntitlementsService } from './entitlements.service';
import { MockBillingProvider } from './mock-billing.provider';

// ---------------------------------------------------------------------------
// EntitlementsModule — wave-74 M9 entitlements substrate; extended wave-75 with
// the billing controller + BillingProvider seam (mock freemium upgrade path).
//
// Resolves subscription tiers and capability caps, and (wave-75) exposes the
// tier-change + plan-read endpoints via BillingController.
//
// Dependency direction:
//   ServersModule imports EntitlementsModule (one-way).
//   EntitlementsModule does NOT import ServersModule → no circular dependency.
//   AppModule imports both independently (order does not matter for acyclicity).
//   Imports AuthModule for the AuthGuard used by BillingController (all three
//   billing endpoints are verification-REQUIRED).
//
// The BILLING_PROVIDER token binds to MockBillingProvider this wave; a real
// Stripe provider drops in behind the SAME token later with no controller change.
//
// Exports EntitlementsService so any module that imports EntitlementsModule
// can inject it (currently ServersModule).
// ---------------------------------------------------------------------------

@Module({
  imports: [AuthModule],
  controllers: [BillingController, EducatorToolsController],
  providers: [
    EntitlementsService,
    EntitlementGuard,
    { provide: BILLING_PROVIDER, useClass: MockBillingProvider },
  ],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
