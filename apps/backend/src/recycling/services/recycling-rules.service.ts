import { GermanBin, RecyclingInfo } from '../dto/recycling.dto';
import { CITY_OVERRIDES, RECYCLING_RULES, type RecyclingRule } from './recycling-rules.constants';

/**
 * Get recycling information based on object name and materials
 */
export function getRecyclingInfo(
  objectName: string,
  materials: string[],
  city?: string,
): RecyclingInfo {
  const normalizedObject = objectName.toLowerCase();
  const normalizedMaterials = materials.map((m) => m.toLowerCase());

  // Find matching rule
  let matchedRule: RecyclingRule | undefined;
  let matchScore = 0;

  for (const rule of RECYCLING_RULES) {
    let score = 0;

    // Check material match
    const materialMatch = normalizedMaterials.some((mat) =>
      rule.materials.some((ruleMat) => mat.includes(ruleMat) || ruleMat.includes(mat)),
    );
    if (materialMatch) score += 2;

    // Check keyword match
    const keywordMatch = rule.keywords.some((keyword) => normalizedObject.includes(keyword));
    if (keywordMatch) score += 3;

    if (score > matchScore) {
      matchScore = score;
      matchedRule = rule;
    }
  }

  // Default to Restmüll if no match
  if (!matchedRule) {
    matchedRule = RECYCLING_RULES.find((r) => r.bin === GermanBin.RESTMUELL)!;
  }

  // Check for exceptions (e.g., greasy)
  let finalBin = matchedRule.bin;
  const finalRules = [...matchedRule.rules];

  if (matchedRule.exceptions) {
    for (const exception of matchedRule.exceptions) {
      if (normalizedObject.includes(exception.condition)) {
        finalBin = exception.overrideBin;
        finalRules.push(exception.reason);
        break;
      }
    }
  }

  // Apply city-specific overrides
  let cityOverride: string | undefined;
  if (city) {
    const normalizedCity = city.toLowerCase();
    const overrides = CITY_OVERRIDES[normalizedCity];
    if (overrides) {
      cityOverride = overrides[0].city;
      if (overrides[0].additionalRules) {
        finalRules.push(...overrides[0].additionalRules);
      }
      if (overrides[0].bin) {
        finalBin = overrides[0].bin;
      }
    }
  }

  return {
    objectName,
    materials,
    bin: finalBin,
    rules: finalRules,
    cityOverride,
  };
}
