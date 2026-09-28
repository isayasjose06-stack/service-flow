import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@serviceflow/shared';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContext = (role?: UserRole): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext);

  it('permite acceso si no hay roles requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('deniega acceso (403) si no hay usuario en request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
  });

  it('deniega acceso (403) CLIENT intentando endpoint TECHNICIAN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TECHNICIAN]);
    expect(() => guard.canActivate(mockContext(UserRole.CLIENT))).toThrow(ForbiddenException);
  });

  it('deniega acceso (403) TECHNICIAN intentando endpoint ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext(UserRole.TECHNICIAN))).toThrow(ForbiddenException);
  });

  it('deniega acceso (403) CLIENT intentando endpoint ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext(UserRole.CLIENT))).toThrow(ForbiddenException);
  });

  it('permite acceso a usuario autorizado', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockContext(UserRole.ADMIN))).toBe(true);
  });
});
