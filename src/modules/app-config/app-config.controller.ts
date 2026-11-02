import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { AppConfigService } from './app-config.service.js';
import { AppConfigDto } from './dto/app-config.dto.js';

@ApiTags('App config')
@Public()
@Controller('app-config')
export class AppConfigController {
  constructor(private readonly appConfig: AppConfigService) {}

  @Get()
  @ApiOperation({
    summary:
      'Settings the apps read on startup (minimum versions, how to reach us, browse radius)',
  })
  getAppConfig(): Promise<AppConfigDto> {
    return this.appConfig.get();
  }
}
