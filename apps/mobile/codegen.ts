import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../schema.gql',
  documents: ['./src/gql/**/*.ts'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
    './src/__generated__/graphql.schema.json': {
      plugins: ['introspection'],
    },
  },
  ignoreNoDocuments: true, // for better experience with the watcher
};

export default config;
