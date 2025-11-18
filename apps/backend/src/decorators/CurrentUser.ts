/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { User } from '~/user/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined => {
    const type = context.getType();
    if (type === 'http') {
      // REST
      const req = context.switchToHttp().getRequest();

      return req.user;
    }
    // GraphQL
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    return req.user;
  },
);
