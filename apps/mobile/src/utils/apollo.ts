import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { withScalars } from 'apollo-link-scalars';
import Constants from 'expo-constants';
import { buildClientSchema, IntrospectionQuery } from 'graphql';

import schema from '../__generated__/graphql.schema.json';

// Load Apollo Client dev messages for better error reporting
if (__DEV__) {
  loadDevMessages();
  loadErrorMessages();
}

// Prefer runtime value from app.config.js (expo constants) falling back to process.env
const runtimeAppUrl =
  (Constants.expoConfig?.extra as any)?.appUrl || process.env.EXPO_PUBLIC_APP_URL || '';
const uri = runtimeAppUrl.replace(/\/$/, '') + '/graphql';

// Helpful runtime log to debug missing envs (check Metro / device logs)
console.log('GRAPHQL_URI:', uri, 'APP_URL:', runtimeAppUrl);

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
