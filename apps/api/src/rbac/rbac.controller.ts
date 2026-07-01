import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { EffectivePermissions, Role } from '@studyhall/shared';
import { AssignRoleSchema, CreateRoleSchema, UpdateRoleSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from './rbac.service';

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

// ---------------------------------------------------------------------------
// RbacController — /servers/:id/roles + /servers/:id/members/:userId/role
// ---------------------------------------------------------------------------

@Controller('servers/:id/roles')
@UseGuards(AuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // GET /servers/:id/roles — list roles (any authenticated member can view)
  @Get()
  async listRoles(@Param('id') serverId: string): Promise<Role[]> {
    return await this.rbacService.listRoles(serverId);
  }

  // POST /servers/:id/roles — create role (requires manage_roles)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @Req() req: SessionAugmentedRequest,
    @Param('id') serverId: string,
    @Body() body: unknown,
  ): Promise<Role> {
    const parsed = CreateRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    const allowed = await this.rbacService.can(userId, serverId, 'manage_roles');
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions: manage_roles required');
    }

    return await this.rbacService.createRole(serverId, parsed.data);
  }

  // PATCH /servers/:id/roles/:roleId — update role (requires manage_roles)
  @Patch(':roleId')
  async updateRole(
    @Req() req: SessionAugmentedRequest,
    @Param('id') serverId: string,
    @Param('roleId') roleId: string,
    @Body() body: unknown,
  ): Promise<Role> {
    const parsed = UpdateRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    const allowed = await this.rbacService.can(userId, serverId, 'manage_roles');
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions: manage_roles required');
    }

    return await this.rbacService.updateRole(serverId, roleId, parsed.data);
  }

  // DELETE /servers/:id/roles/:roleId — delete role (requires manage_roles)
  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Req() req: SessionAugmentedRequest,
    @Param('id') serverId: string,
    @Param('roleId') roleId: string,
  ): Promise<void> {
    const userId = req.session.getUserId();
    const allowed = await this.rbacService.can(userId, serverId, 'manage_roles');
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions: manage_roles required');
    }

    await this.rbacService.deleteRole(serverId, roleId);
  }
}

// ---------------------------------------------------------------------------
// ServerPermissionsController — GET /servers/:serverId/me/permissions
// Returns effective permissions for the authenticated caller in the given server.
// 403 if the caller is not a member.
// ---------------------------------------------------------------------------

@Controller('servers/:serverId')
@UseGuards(AuthGuard)
export class ServerPermissionsController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('me/permissions')
  async getMyPermissions(
    @Req() req: SessionAugmentedRequest,
    @Param('serverId') serverId: string,
  ): Promise<EffectivePermissions> {
    const userId = req.session.getUserId();
    return await this.rbacService.getEffectivePermissions(userId, serverId);
  }
}

// ---------------------------------------------------------------------------
// MemberRoleController — PATCH /servers/:id/members/:userId/role
// Requires manage_members. No self-promote: service enforces as defence-in-depth.
// ---------------------------------------------------------------------------

@Controller('servers/:id/members/:userId/role')
@UseGuards(AuthGuard)
export class MemberRoleController {
  constructor(private readonly rbacService: RbacService) {}

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignRole(
    @Req() req: SessionAugmentedRequest,
    @Param('id') serverId: string,
    @Param('userId') targetUserId: string,
    @Body() body: unknown,
  ): Promise<void> {
    const parsed = AssignRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const callerUserId = req.session.getUserId();

    // Guard: caller must have manage_members (checked in service too as defence-in-depth)
    const allowed = await this.rbacService.can(callerUserId, serverId, 'manage_members');
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions: manage_members required');
    }

    await this.rbacService.assignRole(serverId, targetUserId, callerUserId, parsed.data);
  }
}
