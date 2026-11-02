import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { AppConfigController } from './app-config.controller.js';
import { AppConfigService } from './app-config.service.js';

@Module({
  imports: [SettingsModule],
  controllers: [AppConfigController],
  providers: [AppConfigService],
})
export class AppConfigModule {}
