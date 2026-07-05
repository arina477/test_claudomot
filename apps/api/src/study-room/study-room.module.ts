/**
 * StudyRoomModule — wave-52 M8 joinable focus-room backend
 * Tasks: d123d9e0 (rooms+presence) + ef84b378 (room-timer)
 *
 * Provides:
 *   StudyRoomService  — ephemeral in-memory room/roster/timer state (MUST-LOCK 1+3)
 *   StudyRoomGateway  — Socket.IO /study-room namespace (MUST-LOCK 2 — distinct)
 *
 * Imports:
 *   RbacModule — exports RbacService (assertMember uses server_members directly,
 *     but RbacModule is imported for consistency with other module patterns).
 *
 * No circular dependency:
 *   Service fan-out → gateway via timerUpdateCallback registered in afterInit
 *   (callback pattern, not DI injection of the service from the gateway's side
 *   — avoids the circular dep risk while still emitting to the correct room).
 *   The gateway DOES inject StudyRoomService for room lifecycle operations.
 *
 * EventEmitterModule: NOT imported here — room-timer fan-out goes directly via
 *   the registered callback (no internal EventEmitter2 relay needed since
 *   the gateway can directly call server.to().emit).
 *
 * MUST-LOCK 2 compliance:
 *   StudyTimerModule is NOT imported here. Zero cross-module coupling with
 *   the wave-49 /study-timer namespace, service, or gateway.
 */

import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { StudyRoomGateway } from './study-room.gateway';
import { StudyRoomService } from './study-room.service';

@Module({
  imports: [RbacModule],
  providers: [StudyRoomService, StudyRoomGateway],
  exports: [StudyRoomService],
})
export class StudyRoomModule {}
