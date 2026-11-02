import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DASHBOARD_ROLES,
  Roles,
} from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/enums.js';
import {
  CreateServiceAreaDto,
  ServiceAreaDto,
  UpdateServiceAreaDto,
} from './dto/service-area.dto.js';
import { ServiceAreasService } from './service-areas.service.js';

@ApiTags('Admin: Service areas')
@ApiBearerAuth()
@Roles(...DASHBOARD_ROLES)
@Controller('admin/service-areas')
export class AdminServiceAreasController {
  constructor(private readonly areas: ServiceAreasService) {}

  @Get()
  @ApiOperation({ summary: 'Where Kaziony works' })
  listServiceAreas(): Promise<ServiceAreaDto[]> {
    return this.areas.list();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a service area (admins only)' })
  createServiceArea(
    @Body() dto: CreateServiceAreaDto,
  ): Promise<ServiceAreaDto> {
    return this.areas.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change a service area (admins only)' })
  updateServiceArea(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceAreaDto,
  ): Promise<ServiceAreaDto> {
    return this.areas.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service area (admins only)' })
  deleteServiceArea(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.areas.remove(id);
  }
}
