import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { withScalars } from 'apollo-link-scalars';
import { buildClientSchema, IntrospectionQuery } from 'graphql';

import schema from '../__generated__/graphql.schema.json';

// Load Apollo Client dev messages for better error reporting
if (__DEV__) {
  loadDevMessages();
  loadErrorMessages();
}

const uri = (process.env.EXPO_PUBLIC_APP_URL || '').replace(/\/$/, '') + '/graphql';

// Export a base HTTP link so auth links can be composed without stacking
export const httpLink = createHttpLink({ uri });

const typesMap = {
  DateTime: {
    serialize: (value: Date) => value.toISOString(),
    parseValue: (value: string) => new Date(value),
  },
} as any;

const scalarsLink = withScalars({
  schema: buildClientSchema(schema as IntrospectionQuery),
  typesMap,
});

export const apolloClient = new ApolloClient({
  link: scalarsLink.concat(httpLink),
  cache: new InMemoryCache({
    // Note: The canonizeResults deprecation warning is from Apollo Client internals
    // and will be resolved when Apollo Client 4.0 is released
  }),
});
