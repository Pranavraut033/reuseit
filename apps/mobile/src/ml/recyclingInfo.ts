import { getCurrentLanguage, Language } from '@/src/utils/i18n';

export interface RecyclingInfo {
  short: string; // minimal info for modal
  steps: string[]; // detailed instructions
  caution?: string; // warnings
}

export interface WasteBinInfo {
  accepted: string[];
  notAccepted: string[];
  notes?: string[];
}

export interface RecyclingKnowledge {
  wasteClasses: string[];
  bins: Record<string, WasteBinInfo>;
  pfandSystem: {
    description: string;
    amounts: Record<string, string>;
    howToReturn: string[];
  };
  contaminationRules: string[];
  commonMistakes: {
    item: string;
    correctBin: string;
    reason: string;
  }[];
  municipalVariations: string[];
  recyclingInfo: Record<string, Record<string, RecyclingInfo>>;
}

// Map new model labels to recycling info categories
const LABEL_TO_CATEGORY_MAP: Record<string, string> = {
  paper_cardboard: 'Paper',
  glass: 'Glass',
  recyclables: 'Recyclables', // Metal/plastic recyclables (Gelber Sack/Wertstofftonne)
  bio_waste: 'Organic',
  textile_reuse: 'Textiles',
  electronics: 'Electronics',
  battery: 'Battery',
  residual_waste: 'Residual',
};

// Comprehensive German Recycling Knowledge Base
const GERMAN_RECYCLING_KNOWLEDGE: RecyclingKnowledge = {
  wasteClasses: [
    'paper_cardboard',
    'glass',
    'recyclables',
    'bio_waste',
    'textile_reuse',
    'electronics',
    'battery',
    'residual_waste',
  ],
  bins: {
    'Gelber Sack / Gelbe Tonne': {
      accepted: [
        'Plastic packaging (bottles, trays, wrappers, containers)',
        'Metal packaging (cans, tins, aluminum foil)',
        'Composite packaging (Tetra Pak, beverage cartons)',
        'Clean, empty packaging',
      ],
      notAccepted: ['Food leftovers', 'Non-packaging plastics (toys, buckets)', 'Paper, cardboard'],
      notes: [
        'Items must be empty and lightly rinsed.',
        'Do not nest multiple materials inside each other.',
      ],
    },
    Papiertonne: {
      accepted: [
        'Cardboard, cartons',
        'Newspapers, magazines',
        'Books, notebooks',
        'Paper packaging',
      ],
      notAccepted: [
        'Greasy or contaminated paper (e.g., oily pizza boxes)',
        'Laminated or plastic-coated paper',
        'Tissues or kitchen paper with stains',
      ],
      notes: ['Fold or flatten cardboard to save space.'],
    },
    Glascontainer: {
      accepted: ['Glass bottles (non-deposit)', 'Glass jars'],
      notAccepted: ['Ceramics, porcelain', 'Mirrors, window glass', 'Light bulbs'],
      notes: [
        'Sort by color: white, green, brown.',
        'Labels may remain.',
        'Rinse lightly; no need for perfect cleaning.',
      ],
    },
    Biotonne: {
      accepted: [
        'Fruit and vegetable scraps',
        'Coffee grounds, tea bags',
        'Eggshells, nutshells',
        'Yard waste (grass, leaves, small branches)',
      ],
      notAccepted: [
        'Plastic bags (unless compostable and permitted locally)',
        'Meat, fish, dairy (varies by city)',
        'Cooked food',
        'Cat litter or animal waste',
      ],
    },
    Restmüll: {
      accepted: [
        'Contaminated or non-recyclable items',
        'Hygiene products, diapers',
        'Ceramics, porcelain, broken mirrors',
        'Non-recyclable plastics',
        'Old sponges, brushes',
      ],
      notAccepted: [
        'Batteries, electronics',
        'Paint, chemicals',
        'Recyclable materials that belong in other bins',
      ],
    },
    Sondermüll: {
      accepted: [
        'Batteries and accumulators',
        'Electronics and small appliances',
        'Bulbs and lamps',
        'Paints, solvents, oils',
        'Chemicals',
        'Pharmaceuticals (pharmacy drop-off)',
      ],
      notAccepted: [],
      notes: [
        'Cannot be disposed of in household bins.',
        'Use municipal recycling centers ("Wertstoffhöfe").',
      ],
    },
  },
  pfandSystem: {
    description: "Germany's deposit system applies to most beverage containers.",
    amounts: {
      '€0.25': 'Plastic bottles, most cans',
      '€0.08–0.15': 'Reusable glass bottles (Mehrweg)',
    },
    howToReturn: [
      'Bring to any supermarket with a Pfandautomat.',
      'Must be empty; light rinsing recommended.',
      'You receive a printed voucher redeemable at checkout.',
    ],
  },
  contaminationRules: [
    'Rinse containers briefly; no need for perfect washing.',
    'Remove large food residues only.',
    'Labels can remain on glass and most plastics.',
    'Flatten items when possible (e.g., cartons, bottles).',
  ],
  commonMistakes: [
    {
      item: 'Greasy pizza box',
      correctBin: 'Restmüll',
      reason: 'Paper is contaminated',
    },
    {
      item: 'Broken mirror',
      correctBin: 'Restmüll',
      reason: 'Not recyclable as glass',
    },
    {
      item: 'Plastic toys',
      correctBin: 'Restmüll',
      reason: 'Not packaging',
    },
    {
      item: 'Tetra Pak',
      correctBin: 'Gelber Sack',
      reason: 'Composite packaging',
    },
    {
      item: 'Batteries',
      correctBin: 'Sondermüll',
      reason: 'Hazardous materials',
    },
    {
      item: 'Deposit bottles',
      correctBin: 'Return to shop',
      reason: 'Refundable',
    },
  ],
  municipalVariations: [
    'Rules differ slightly by city (e.g., meat in Biotonne).',
    'Some municipalities offer: Textilcontainer (textile bins), Wertstofftonne (mixed recyclables)',
    'Always check local collection calendars.',
  ],
  recyclingInfo: {
    en: {
      Paper: {
        short: 'Keep dry & clean. Flatten cardboard boxes. Remove plastic windows.',
        steps: [
          'Remove plastic windows from envelopes and packaging.',
          'Flatten cardboard boxes to save space.',
          'Keep paper dry—wet paper cannot be recycled.',
          'Remove heavily soiled paper (e.g., greasy pizza boxes).',
          'Newspapers, magazines, office paper, and cardboard are all recyclable.',
        ],
        caution: 'Do not include waxed paper, thermal receipts, or contaminated paper.',
      },
      Glass: {
        short: 'Rinse containers. Separate by color if required. Remove metal lids.',
        steps: [
          'Rinse containers to remove residue.',
          'Separate glass by color (white, green, brown) if local system requires.',
          'Remove metal or plastic lids and caps.',
          'Labels can usually remain on containers.',
          'Only packaging glass—no windows, mirrors, or ceramics.',
        ],
        caution: 'Broken glass, ceramics, and Pyrex damage recycling equipment.',
      },
      Recyclables: {
        short: 'Packaging with Green Dot symbol. Rinse and flatten. Metal and plastic together.',
        steps: [
          'Look for the Green Dot (Der Grüne Punkt) symbol on packaging.',
          'Include plastic packaging, yogurt containers, metal cans, and composite materials.',
          'Rinse to remove food residue—dry packaging is best.',
          'Flatten packaging to save space in yellow bag/bin.',
          'Caps and lids can stay on bottles.',
        ],
        caution:
          'Do not include non-packaging items like toys, hangers, or household goods—use residual waste.',
      },
      Organic: {
        short: 'Food scraps, garden waste. No plastic bags. Keep lid closed.',
        steps: [
          'Include fruit/vegetable scraps, coffee grounds, tea bags, and garden waste.',
          'Use compostable bags or newspaper to line bin.',
          'No cooked food, meat, or dairy if local system prohibits.',
          'Chop large pieces to speed decomposition.',
          'Keep bin closed to prevent odors and pests.',
        ],
        caution: 'Never use plastic bags—only certified compostable bags or paper.',
      },
      Textiles: {
        short: 'Clean, dry clothing and textiles. Donate wearable items to charity.',
        steps: [
          'Wash and dry items before disposal.',
          'Wearable clothing: Donate to charity shops or textile collection containers.',
          'Damaged textiles: Use designated textile recycling bins.',
          'Tie shoes together in pairs.',
          'Use closed bags to keep items dry.',
        ],
        caution: 'Wet or moldy textiles cannot be recycled—dispose in residual waste.',
      },
      Electronics: {
        short: 'E-waste collection at Recyclinghof or retailer take-back. Remove batteries first.',
        steps: [
          'Remove batteries and dispose separately.',
          'Delete personal data from devices.',
          'Retailers must take back old devices when buying new ones (free of charge).',
          'Large items: Bring to Recyclinghof (recycling center).',
          'Small items: Some retailers have in-store collection boxes.',
        ],
        caution: 'Never dispose in residual waste—contains hazardous materials.',
      },
      Battery: {
        short: 'Collection boxes at retailers and Recyclinghof. Tape lithium battery terminals.',
        steps: [
          'Tape terminals of lithium batteries to prevent fires.',
          'Return to collection boxes at supermarkets, drugstores, or electronics retailers.',
          'All retailers selling batteries must take them back (free of charge).',
          'Bring to Recyclinghof for large quantities.',
        ],
        caution: 'Damaged batteries can cause fires—handle with care and store separately.',
      },
      Residual: {
        short: 'Non-recyclable waste. Last resort after sorting recyclables.',
        steps: [
          'Use for items that cannot be recycled or composted.',
          'Examples: heavily soiled items, non-packaging plastics, broken ceramics.',
          'Minimize residual waste by properly sorting recyclables.',
          'Close bags tightly to prevent odors.',
        ],
        caution: 'Reducing residual waste helps the environment and lowers waste fees.',
      },
      Unknown: {
        short: 'Item not recognized. Check local recycling guide or ask at Recyclinghof.',
        steps: [
          'Look for recycling symbols on packaging.',
          'When in doubt, ask at your local Recyclinghof.',
          'Visit your city website for detailed sorting guidelines.',
          'Avoid "wish-cycling"—putting non-recyclables in recycling bins.',
        ],
      },
    },
    de: {
      Paper: {
        short: 'Trocken & sauber halten. Kartons flach drücken. Plastikfenster entfernen.',
        steps: [
          'Plastikfenster von Briefumschlägen und Verpackungen entfernen.',
          'Kartons flach drücken, um Platz zu sparen.',
          'Papier trocken halten—nasses Papier kann nicht recycelt werden.',
          'Stark verschmutztes Papier entfernen (z.B. fettige Pizzakartons).',
          'Zeitungen, Zeitschriften, Büropapier und Kartons sind recycelbar.',
        ],
        caution: 'Kein Wachspapier, Thermopapier-Belege oder kontaminiertes Papier.',
      },
      Glass: {
        short: 'Behälter ausspülen. Nach Farbe trennen. Metalldeckel entfernen.',
        steps: [
          'Behälter ausspülen, um Rückstände zu entfernen.',
          'Glas nach Farbe trennen (weiß, grün, braun) wenn lokal erforderlich.',
          'Metall- oder Plastikdeckel und -kappen entfernen.',
          'Etiketten können meist auf Behältern bleiben.',
          'Nur Verpackungsglas—keine Fenster, Spiegel oder Keramik.',
        ],
        caution: 'Glasbruch, Keramik und Pyrex beschädigen Recyclinganlagen.',
      },
      Recyclables: {
        short:
          'Verpackungen mit Grünem Punkt. Ausspülen und flach drücken. Metall und Plastik zusammen.',
        steps: [
          'Nach dem Grünen Punkt Symbol auf Verpackungen suchen.',
          'Plastikverpackungen, Joghurtbecher, Metalldosen und Verbundmaterialien gehören dazu.',
          'Ausspülen, um Essensreste zu entfernen—trockene Verpackung ist am besten.',
          'Verpackungen flach drücken, um Platz im Gelben Sack/Tonne zu sparen.',
          'Verschlüsse und Deckel können auf Flaschen bleiben.',
        ],
        caution:
          'Keine Nicht-Verpackungen wie Spielzeug, Kleiderbügel oder Haushaltswaren—in Restmüll.',
      },
      Organic: {
        short: 'Essensreste, Gartenabfälle. Keine Plastiktüten. Deckel geschlossen halten.',
        steps: [
          'Obst-/Gemüsereste, Kaffeesatz, Teebeutel und Gartenabfälle gehören dazu.',
          'Kompostierbare Tüten oder Zeitungspapier zum Auskleiden verwenden.',
          'Kein gekochtes Essen, Fleisch oder Milchprodukte, wenn lokal verboten.',
          'Große Stücke zerkleinern, um Zersetzung zu beschleunigen.',
          'Tonne geschlossen halten, um Gerüche und Schädlinge zu vermeiden.',
        ],
        caution:
          'Niemals Plastiktüten verwenden—nur zertifizierte kompostierbare Tüten oder Papier.',
      },
      Textiles: {
        short: 'Saubere, trockene Kleidung und Textilien. Tragbare Artikel spenden.',
        steps: [
          'Artikel vor Entsorgung waschen und trocknen.',
          'Tragbare Kleidung: An Wohltätigkeitsläden oder Altkleidercontainer spenden.',
          'Beschädigte Textilien: Spezielle Textil-Recyclingbehälter nutzen.',
          'Schuhe paarweise zusammenbinden.',
          'Geschlossene Tüten verwenden, um Artikel trocken zu halten.',
        ],
        caution: 'Nasse oder schimmelige Textilien können nicht recycelt werden—in Restmüll.',
      },
      Electronics: {
        short: 'E-Schrott am Recyclinghof oder Händler-Rücknahme. Batterien vorher entfernen.',
        steps: [
          'Batterien entfernen und separat entsorgen.',
          'Persönliche Daten von Geräten löschen.',
          'Händler müssen alte Geräte beim Neukauf zurücknehmen (kostenlos).',
          'Große Geräte: Zum Recyclinghof bringen.',
          'Kleine Geräte: Manche Händler haben Sammelboxen im Laden.',
        ],
        caution: 'Niemals im Restmüll entsorgen—enthält gefährliche Materialien.',
      },
      Battery: {
        short: 'Sammelboxen bei Händlern und Recyclinghof. Lithiumbatterien abkleben.',
        steps: [
          'Pole von Lithiumbatterien abkleben, um Brände zu vermeiden.',
          'In Sammelboxen bei Supermärkten, Drogerien oder Elektronikhändlern zurückgeben.',
          'Alle Händler, die Batterien verkaufen, müssen sie zurücknehmen (kostenlos).',
          'Bei großen Mengen zum Recyclinghof bringen.',
        ],
        caution:
          'Beschädigte Batterien können Brände verursachen—vorsichtig handhaben und separat lagern.',
      },
      Residual: {
        short: 'Nicht-recycelbarer Abfall. Letzte Option nach Sortierung der Wertstoffe.',
        steps: [
          'Für Artikel verwenden, die nicht recycelt oder kompostiert werden können.',
          'Beispiele: stark verschmutzte Artikel, Nicht-Verpackungsplastik, zerbrochene Keramik.',
          'Restmüll minimieren durch korrekte Sortierung der Wertstoffe.',
          'Tüten fest verschließen, um Gerüche zu vermeiden.',
        ],
        caution: 'Reduzierung des Restmülls schont die Umwelt und senkt Abfallgebühren.',
      },
      Unknown: {
        short:
          'Artikel nicht erkannt. Lokale Recycling-Anleitung prüfen oder am Recyclinghof fragen.',
        steps: [
          'Nach Recyclingsymbolen auf Verpackungen suchen.',
          'Im Zweifelsfall am lokalen Recyclinghof nachfragen.',
          'Website Ihrer Stadt für detaillierte Sortierrichtlinien besuchen.',
          '"Wunsch-Recycling" vermeiden—keine nicht-recycelbaren Artikel in Recyclingbehälter.',
        ],
      },
    },
  },
};

export function getRecyclingInfo(label: string, lang?: Language): RecyclingInfo {
  const language = lang || getCurrentLanguage();
  const langKey = language === 'de' ? 'de' : 'en';

  // Map model label to recycling category first
  const category = LABEL_TO_CATEGORY_MAP[label] || label;
  return (
    GERMAN_RECYCLING_KNOWLEDGE.recyclingInfo[langKey][category] ||
    GERMAN_RECYCLING_KNOWLEDGE.recyclingInfo[langKey]['Unknown']
  );
}

export function getWasteClasses(): string[] {
  return GERMAN_RECYCLING_KNOWLEDGE.wasteClasses;
}

export function getRecyclingKnowledge(lang?: Language): RecyclingKnowledge {
  const language = lang || getCurrentLanguage();
  const langKey = language === 'de' ? 'de' : 'en';

  return {
    ...GERMAN_RECYCLING_KNOWLEDGE,
    recyclingInfo: {
      [langKey]: GERMAN_RECYCLING_KNOWLEDGE.recyclingInfo[langKey],
    },
  };
}
