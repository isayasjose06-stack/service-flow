import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@serviceflow/shared';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly adminCategoriesService: AdminCategoriesService) {}

  @Get('categories')
  async getCategories() {
    return this.adminCategoriesService.getCategories();
  }

  @Post('categories')
  async createCategory(
    @CurrentUser('sub') adminId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.adminCategoriesService.createCategory(adminId, dto);
  }

  @Patch('categories/:id')
  async updateCategory(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminCategoriesService.updateCategory(adminId, id, dto);
  }

  @Get('subcategories')
  async getSubcategories() {
    return this.adminCategoriesService.getSubcategories();
  }

  @Post('subcategories')
  async createSubcategory(
    @CurrentUser('sub') adminId: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.adminCategoriesService.createSubcategory(adminId, dto);
  }

  @Patch('subcategories/:id')
  async updateSubcategory(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.adminCategoriesService.updateSubcategory(adminId, id, dto);
  }
}
