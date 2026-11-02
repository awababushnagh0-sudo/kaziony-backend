import { Module } from '@nestjs/common';
import { AdminServiceAreasController } from './admin-service-areas.controller.js';
import { AdminSettingsController } from './admin-settings.controller.js';
import { ServiceAreasService } from './service-areas.service.js';
import { SettingsService } from './settings.service.js';

@Module({
  controllers: [AdminSettingsController, AdminServiceAreasController],
  providers: [SettingsService, ServiceAreasService],
  exports: [SettingsService, ServiceAreasService],
})
export class SettingsModule {}
