import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, UserStatus } from '@serviceflow/shared';
import { BlockUserDto } from './dto/block-user.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    return this.adminUsersService.getUsers(pageNumber, limitNumber, role, status);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Post(':id/block')
  async blockUser(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
    @Body() blockUserDto: BlockUserDto,
  ) {
    return this.adminUsersService.blockUser(adminId, id, blockUserDto.reason);
  }

  @Post(':id/unblock')
  async unblockUser(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
  ) {
    return this.adminUsersService.unblockUser(adminId, id);
  }
}
