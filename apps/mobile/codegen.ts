import { CodegenConfig } from '@graphql-codegen/cli';
import { join } from 'path';

const config: CodegenConfig = {
  overwrite: true,
  schema: join(process.cwd(), '../backend/schema.gql'),
  documents: ['./src/gql/**/*.ts'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
    },
    './src/__generated__/types.ts': {
      plugins: ['typescript', 'typescript-operations'],
    },
    './src/__generated__/graphql.schema.json': {
      plugins: ['introspection'],
    },
  },
  ignoreNoDocuments: true, // for better experience with the watcher
};

export default config;
