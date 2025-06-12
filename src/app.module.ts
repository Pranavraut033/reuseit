import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { EventModule } from './event/event.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AuthModule } from './auth/auth.module';

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
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
