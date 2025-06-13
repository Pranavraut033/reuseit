import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { EventModule } from 'src/event/event.module';
import { GraphQLModule } from '@nestjs/graphql';
import { Module } from '@nestjs/common';
import { PostModule } from 'src/post/post.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    EventModule,
    UserModule,
    PostModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      graphiql: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    AuthModule,
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
