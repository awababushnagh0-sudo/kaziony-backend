import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DASHBOARD_ROLES,
  Roles,
} from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/enums.js';
import { AppSettingsDto, UpdateAppSettingsDto } from './dto/settings.dto.js';
import { SettingsService } from './settings.service.js';

@ApiTags('Admin: Settings')
@ApiBearerAuth()
@Roles(...DASHBOARD_ROLES)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Platform settings (browse radius)' })
  getSettings(): Promise<AppSettingsDto> {
    return this.settings.get();
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change platform settings (admins only)' })
  updateSettings(@Body() dto: UpdateAppSettingsDto): Promise<AppSettingsDto> {
    return this.settings.update(dto);
  }
}
