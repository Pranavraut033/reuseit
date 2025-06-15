import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './schema.gql',
  documents: ['./gql/**/*.ts'],
  generates: {
    './__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
    './__generated__/graphql.schema.json': {
      plugins: ['introspection'],
    },
  },
  ignoreNoDocuments: true, // for better experience with the watcher
};

export default config;
