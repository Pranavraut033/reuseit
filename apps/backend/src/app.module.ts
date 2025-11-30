import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import KeyvRedis from '@keyv/redis';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { CacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';
import { DataLoaderInterceptor } from 'nestjs-dataloader';
import { join } from 'path';

import { AuthGuard } from '~/auth/auth.guard';
import { AuthModule } from '~/auth/auth.module';
import { EventModule } from '~/event/event.module';
import { PointsModule } from '~/points/points.module';
import { PostModule } from '~/post/post.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { UserModule } from '~/user/user.module';

import { FirebaseModule } from './firebase/firebase.module';
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { HealthController } from './health/health.controller';
import { LocationModule } from './location/location.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Enable GraphQL Playground in development
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      // Ensure the HTTP request is available in GraphQL context for guards/decorators
      context: ({ req, res }) => ({
        req,
        res,
      }),
      autoSchemaFile: join(process.cwd(), 'prisma/schema.gql'),
    }),
    AuthModule,
    EventModule,
    FirebaseModule,
    LocationModule,
    PointsModule,
    PostModule,
    PrismaModule,
    LlmModule,
    UserModule,
    GoogleMapsModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis(process.env.REDIS_URL || 'redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataLoaderInterceptor,
    },
  ],
})
export class AppModule {
  // The AppModule is the root module of the application.
}
