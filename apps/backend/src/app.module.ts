import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '~/auth/auth.guard';
import { AuthModule } from '~/auth/auth.module';
import { EventModule } from '~/event/event.module';
import { GraphQLModule } from '@nestjs/graphql';
import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase/firebase.module';
import { PostModule } from '~/post/post.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { UserModule } from '~/user/user.module';
import { PointsModule } from '~/points/points.module';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    EventModule,
    UserModule,
    PostModule,
    PointsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Enable GraphQL Playground in development
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      // Ensure the HTTP request is available in GraphQL context for guards/decorators
      context: ({ req, res }) => ({ req, res }),
      autoSchemaFile: join(process.cwd(), '/../schema.gql'),
    }),
    AuthModule,
    FirebaseModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {
  // The AppModule is the root module of the application.
}
