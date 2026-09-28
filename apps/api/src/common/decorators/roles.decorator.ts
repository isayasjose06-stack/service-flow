import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@serviceflow/shared';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access to specific roles.
 * Usage: @Roles(UserRole.ADMIN)
 * Requires RolesGuard to be applied.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
