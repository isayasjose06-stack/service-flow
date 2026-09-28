import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { UserRole, UserStatus } from '@serviceflow/shared';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async getUsers(page: number, limit: number, role?: UserRole, status?: UserStatus) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true,
        },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        clientProfile: true,
        technicianProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async blockUser(adminId: string, userId: string, reason: string) {
    if (adminId === userId) {
      throw new ForbiddenException('You cannot block yourself');
    }

    const userToBlock = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToBlock) {
      throw new NotFoundException('User not found');
    }

    if (userToBlock.role === UserRole.ADMIN) {
      const activeAdmins = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      });

      if (activeAdmins <= 1 && userToBlock.status === UserStatus.ACTIVE) {
        throw new BadRequestException('Cannot block the last active admin');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.BLOCKED },
    });

    await this.auditService.logAction(adminId, 'BLOCK_USER', 'User', userId, { reason });

    this.eventEmitter.emit('notification.send', {
      userId: updatedUser.id,
      type: NotificationType.ACCOUNT_STATUS_CHANGED,
      title: 'Cuenta Bloqueada',
      body: `Tu cuenta ha sido bloqueada. Razón: ${reason}`,
      data: { status: 'BLOCKED' },
      sendEmail: true,
      sendPush: true,
      idempotencyKey: `account_blocked_${updatedUser.id}`
    });

    return { message: 'User blocked successfully', user: { id: updatedUser.id, status: updatedUser.status } };
  }

  async unblockUser(adminId: string, userId: string) {
    const userToUnblock = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUnblock) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    await this.auditService.logAction(adminId, 'UNBLOCK_USER', 'User', userId);

    this.eventEmitter.emit('notification.send', {
      userId: updatedUser.id,
      type: NotificationType.ACCOUNT_STATUS_CHANGED,
      title: 'Cuenta Desbloqueada',
      body: 'Tu cuenta ha sido reactivada.',
      data: { status: 'ACTIVE' },
      sendEmail: true,
      sendPush: true,
      idempotencyKey: `account_unblocked_${updatedUser.id}`
    });

    return { message: 'User unblocked successfully', user: { id: updatedUser.id, status: updatedUser.status } };
  }
}
