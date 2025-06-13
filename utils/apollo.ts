import { ApolloClient, InMemoryCache } from '@apollo/client';
console.log({ uri: process.env.EXPO_PUBLIC_APP_URL + '/graphql' });

export const apolloClient = new ApolloClient({
  uri: process.env.EXPO_PUBLIC_APP_URL + '/graphql',
  cache: new InMemoryCache(),
});
