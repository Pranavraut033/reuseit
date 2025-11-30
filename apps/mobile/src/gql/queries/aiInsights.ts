import { gql } from '~/__generated__';

export const AI_INSIGHTS_QUERY = gql(`
  query AIInsights($input: AIInsightsInput!) {
    AIInsights(input: $input) {
      extra_facts
      simplified_summary
      motivation_text
    }
  }
`);
