/**
 * ML-based tag suggestion service
 * This is a placeholder implementation that can be enhanced with TensorFlow Lite
 * for on-device ML inference
 */

export interface TagSuggestion {
  tag: string;
  confidence: number;
}

// Common Berlin-relevant tags for reuse/sustainability
export const BERLIN_TAGS = [
  'sustainable',
  'recycling',
  'reuse',
  'donation',
  'free',
  'swap',
  'upcycle',
  'ecofriendly',
  'zerowaste',
  'circular',
];

// Category-specific tag mappings
const CATEGORY_TAG_MAP: Record<string, string[]> = {
  electronics: ['technology', 'gadget', 'device', 'repair', 'refurbished'],
  toys: ['kids', 'children', 'games', 'educational', 'playful'],
  homeGoods: ['kitchen', 'decor', 'household', 'practical', 'functional'],
  clothing: ['fashion', 'apparel', 'vintage', 'secondhand', 'textiles'],
  furniture: ['home', 'interior', 'wood', 'vintage', 'functional'],
  books: ['reading', 'literature', 'knowledge', 'education', 'stories'],
  sports: ['fitness', 'outdoor', 'active', 'health', 'equipment'],
  other: ['miscellaneous', 'unique', 'special'],
};

// Condition-specific tags
const CONDITION_TAG_MAP: Record<string, string[]> = {
  new: ['unused', 'pristine', 'mint'],
  likeNew: ['excellent', 'barely used', 'mint condition'],
  good: ['well maintained', 'functional', 'working'],
  fair: ['some wear', 'usable', 'functional'],
  used: ['pre-owned', 'vintage', 'preloved'],
};

/**
 * Analyzes text and suggests relevant tags
 * In production, this would use TensorFlow Lite for on-device ML inference
 * @param text - Text to analyze
 * @param category - Item category
 * @param condition - Item condition
 * @returns Array of suggested tags with confidence scores
 */
export const suggestTags = async (
  text: string,
  category?: string,
  condition?: string,
): Promise<TagSuggestion[]> => {
  const suggestions: TagSuggestion[] = [];
  const lowerText = text.toLowerCase();

  // Add category-specific tags
  if (category && CATEGORY_TAG_MAP[category]) {
    CATEGORY_TAG_MAP[category].forEach((tag) => {
      suggestions.push({ tag, confidence: 0.8 });
    });
  }

  // Add condition-specific tags
  if (condition && CONDITION_TAG_MAP[condition]) {
    CONDITION_TAG_MAP[condition].forEach((tag) => {
      suggestions.push({ tag, confidence: 0.7 });
    });
  }

  // Add Berlin-relevant tags based on keywords
  BERLIN_TAGS.forEach((tag) => {
    if (lowerText.includes(tag)) {
      suggestions.push({ tag, confidence: 0.9 });
    }
  });

  // Keyword-based suggestions
  const keywords = [
    { keywords: ['free', 'kostenlos', 'gratis'], tag: 'free', confidence: 0.95 },
    { keywords: ['swap', 'tausch', 'exchange'], tag: 'swap', confidence: 0.95 },
    { keywords: ['donate', 'spende', 'give'], tag: 'donation', confidence: 0.9 },
    { keywords: ['eco', 'green', 'umwelt', 'nachhaltig'], tag: 'ecofriendly', confidence: 0.9 },
    { keywords: ['vintage', 'antique', 'retro'], tag: 'vintage', confidence: 0.85 },
    { keywords: ['handmade', 'craft', 'diy'], tag: 'handmade', confidence: 0.85 },
    { keywords: ['repair', 'fix', 'reparatur'], tag: 'repair', confidence: 0.8 },
  ];

  keywords.forEach(({ keywords: kws, tag, confidence }) => {
    if (kws.some((kw) => lowerText.includes(kw))) {
      suggestions.push({ tag, confidence });
    }
  });

  // Remove duplicates and sort by confidence
  const uniqueSuggestions = Array.from(new Map(suggestions.map((s) => [s.tag, s])).values()).sort(
    (a, b) => b.confidence - a.confidence,
  );

  return uniqueSuggestions.slice(0, 10); // Return top 10 suggestions
};

/**
 * Analyzes images and suggests tags (placeholder)
 * In production, this would use TensorFlow Lite for image classification
 * @param imageUris - Array of image URIs
 * @returns Array of suggested tags
 */
export const suggestTagsFromImages = async (_imageUris: string[]): Promise<TagSuggestion[]> => {
  // Placeholder implementation
  // In production, integrate TensorFlow Lite MobileNet or custom model
  return [
    { tag: 'visual', confidence: 0.6 },
    { tag: 'item', confidence: 0.5 },
  ];
};

/**
 * Gets popular tags for a given category
 * @param category - Category name
 * @returns Array of popular tags
 */
export const getPopularTags = (category?: string): string[] => {
  const baseTags = [...BERLIN_TAGS];

  if (category && CATEGORY_TAG_MAP[category]) {
    return [...baseTags, ...CATEGORY_TAG_MAP[category]].slice(0, 15);
  }

  return baseTags;
};
