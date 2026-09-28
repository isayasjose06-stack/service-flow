import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  getProfile(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.usersService.getProfile(userId, role);
  }

  @Patch('me/profile')
  updateProfile(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, role, updateProfileDto);
  }
}
