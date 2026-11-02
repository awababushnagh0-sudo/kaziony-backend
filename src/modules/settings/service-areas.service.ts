import { Injectable, NotFoundException } from '@nestjs/common';
import { distanceKm, type LatLng } from '../../common/utils/geo.js';
import { PrismaService } from '../../database/prisma.service.js';
import type { ServiceArea } from '../../generated/prisma/client.js';
import type {
  BrowseAreaDto,
  CreateServiceAreaDto,
  ServiceAreaDto,
  UpdateServiceAreaDto,
} from './dto/service-area.dto.js';

/** Where Kaziony works: customers browse from inside one of these. */
@Injectable()
export class ServiceAreasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ServiceAreaDto[]> {
    const areas = await this.prisma.serviceArea.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return areas.map(toDto);
  }

  /** The areas that are on, for the apps. */
  async listActive(): Promise<BrowseAreaDto[]> {
    const areas = await this.prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return areas.map(toBrowseDto);
  }

  /** Whether [point] is inside an area that is on. */
  async covers(point: LatLng): Promise<boolean> {
    const areas = await this.listActive();
    return areas.some((area) => distanceKm(point, area) <= area.radiusKm);
  }

  async create(dto: CreateServiceAreaDto): Promise<ServiceAreaDto> {
    return toDto(await this.prisma.serviceArea.create({ data: dto }));
  }

  async update(id: string, dto: UpdateServiceAreaDto): Promise<ServiceAreaDto> {
    await this.findOrThrow(id);
    return toDto(
      await this.prisma.serviceArea.update({ where: { id }, data: dto }),
    );
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.serviceArea.delete({ where: { id } });
  }

  private async findOrThrow(id: string): Promise<ServiceArea> {
    const area = await this.prisma.serviceArea.findUnique({ where: { id } });
    if (!area) throw new NotFoundException('Service area not found');
    return area;
  }
}

function toBrowseDto(area: ServiceArea): BrowseAreaDto {
  return {
    nameAr: area.nameAr,
    nameEn: area.nameEn,
    latitude: area.latitude,
    longitude: area.longitude,
    radiusKm: area.radiusKm,
  };
}

function toDto(area: ServiceArea): ServiceAreaDto {
  return { id: area.id, ...toBrowseDto(area), isActive: area.isActive };
}
