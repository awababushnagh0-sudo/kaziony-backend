import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import { ServiceAreasService } from '../settings/service-areas.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { AppConfigDto } from './dto/app-config.dto.js';

/** What the apps read on startup: from the environment and our settings. */
@Injectable()
export class AppConfigService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly settings: SettingsService,
    private readonly serviceAreas: ServiceAreasService,
  ) {}

  async get(): Promise<AppConfigDto> {
    const [{ browseRadiusKm }, areas] = await Promise.all([
      this.settings.get(),
      this.serviceAreas.listActive(),
    ]);
    return {
      partner: {
        minVersion: this.config.get('PARTNER_APP_MIN_VERSION', {
          infer: true,
        }),
      },
      customer: {
        minVersion: this.config.get('CUSTOMER_APP_MIN_VERSION', {
          infer: true,
        }),
      },
      admin: {
        minVersion: this.config.get('ADMIN_APP_MIN_VERSION', { infer: true }),
      },
      support: {
        phone: this.config.get('SUPPORT_PHONE', { infer: true }),
        whatsapp: this.config.get('SUPPORT_WHATSAPP', { infer: true }),
        email: this.config.get('SUPPORT_EMAIL', { infer: true }),
        hoursAr: this.config.get('SUPPORT_HOURS_AR', { infer: true }),
        hoursEn: this.config.get('SUPPORT_HOURS_EN', { infer: true }),
      },
      browse: { radiusKm: browseRadiusKm, areas },
    };
  }
}
