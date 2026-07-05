/**
 * StudyTimerModule — wave-49 M8 shared study timer
 * Tasks: 1387d845, cb81bf03, 832b83b7
 *
 * Provides:
 *   StudyTimerService   — compute-on-read timer state + one-shot auto-advance
 *   StudyTimerGateway   — Socket.IO /study-timer namespace (fan-out + presence)
 *   StudyTimerController — REST endpoints: start/pause/resume/reset/GET
 *
 * Imports:
 *   RbacModule — exports RbacService (membership check via server_members + owner gate)
 *
 * EventEmitterModule is registered at AppModule level; StudyTimerService injects
 *   EventEmitter2 via NestJS DI without a local EventEmitterModule import.
 *
 * No circular dependency: StudyTimerService emits 'study-timer.updated' via
 *   EventEmitter2; StudyTimerGateway handles @OnEvent without injecting the service
 *   (one-way: service → emitter → gateway). The gateway DOES inject StudyTimerService
 *   only for getTimerForRoom() at join_timer_room time (reconciliation).
 */

import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { StudyTimerController } from './study-timer.controller';
import { StudyTimerGateway } from './study-timer.gateway';
import { StudyTimerService } from './study-timer.service';

@Module({
  imports: [RbacModule],
  controllers: [StudyTimerController],
  providers: [StudyTimerService, StudyTimerGateway],
  exports: [StudyTimerService],
})
export class StudyTimerModule {}
