import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

// Load Apollo Client dev messages for better error reporting
if (__DEV__) {
  loadDevMessages();
  loadErrorMessages();
}

const uri = (process.env.EXPO_PUBLIC_APP_URL || '').replace(/\/$/, '') + '/graphql';

// Export a base HTTP link so auth links can be composed without stacking
export const httpLink = createHttpLink({ uri });

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    // Note: The canonizeResults deprecation warning is from Apollo Client internals
    // and will be resolved when Apollo Client 4.0 is released
  }),
});
