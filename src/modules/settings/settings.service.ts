import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { AppSettings } from '../../generated/prisma/client.js';
import type {
  AppSettingsDto,
  UpdateAppSettingsDto,
} from './dto/settings.dto.js';

/** Settings our team changes from the dashboard, without a release. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The one settings row, which its migration made. */
  async get(): Promise<AppSettingsDto> {
    return toDto(await this.prisma.appSettings.findFirstOrThrow());
  }

  async update(dto: UpdateAppSettingsDto): Promise<AppSettingsDto> {
    await this.prisma.appSettings.updateMany({ data: dto });
    return this.get();
  }
}

function toDto(settings: AppSettings): AppSettingsDto {
  return { browseRadiusKm: settings.browseRadiusKm };
}
