import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';

import { GoogleMapsResolver } from './google-maps.resolver';
import { GoogleMapsService } from './google-maps.service';

@Module({
  imports: [CacheModule.register({ ttl: 0 })], // per-method TTL set in service
  providers: [GoogleMapsService, GoogleMapsResolver],
  exports: [GoogleMapsService],
})
export class GoogleMapsModule {}
