import { gql } from '@apollo/client';

export const FINALIZE_RECYCLING = gql(`
  query FinalizeRecycling($input: FinalizeRecyclingInput!) {
    finalizeRecycling(input: $input) {
      objectName
      materials
      recycling {
        objectName
        materials
        bin
        rules
        cityOverride
      }
      instructions
    }
  }
`);
