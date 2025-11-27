import { Controller, Get } from '@nestjs/common';

import { Public } from '~/auth/constants';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    } as const;
  }
}
