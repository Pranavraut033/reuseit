import { gql } from '@apollo/client';

export const ANALYZE_WASTE = gql(`
  query AnalyzeWaste($input: AnalyzeWasteInput!) {
    analyzeWaste(input: $input) {
      detections {
        name
        confidence
        bbox
        class_id
      }
      recycling_plan {
        item_name
        material_type
        category
        german_bin
        is_pfand
        recycling_instructions
        reuse_ideas
        notes_germany
      }
      latency_ms {
        detector
        reasoner
        total
      }
      models {
        vision
        llm
      }
    }
  }
`);
