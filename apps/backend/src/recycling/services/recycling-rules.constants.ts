import { GermanBin } from '../dto/recycling.dto';

export interface RecyclingRule {
  bin: GermanBin;
  materials: string[];
  keywords: string[];
  rules: string[];
  exceptions?: { condition: string; overrideBin: GermanBin; reason: string }[];
}

export interface CityOverride {
  city: string;
  bin?: GermanBin;
  additionalRules?: string[];
}

const RECYCLING_RULES: RecyclingRule[] = [
  // ---------------------------------------------------------
  // 1. GELBER SACK / WERTSTOFFTONNE – lightweight packaging
  // ---------------------------------------------------------
  {
    bin: GermanBin.GELBER_SACK,
    materials: ['plastic', 'PET', 'PP', 'HDPE', 'metal', 'aluminium', 'composite', 'tetra', 'foil'],
    keywords: [
      'bottle',
      'can',
      'tetrapak',
      'packaging',
      'wrapper',
      'foil',
      'yogurt',
      'cup',
      'container',
      'tube',
      'shampoo',
      'soap bottle',
      'chips bag',
      'snack packaging',
    ],
    rules: [
      'Empty and rinse containers before disposal',
      'Remove caps or lids if they use a different material',
      'Foil, chip bags, and mixed packaging all go here',
      'Flatten plastic bottles and cartons to save space',
      'Scrape food residue; do not discard heavily soiled packaging',
    ],
    exceptions: [
      {
        condition: 'greasy',
        overrideBin: GermanBin.RESTMUELL,
        reason: 'Greasy or heavily food-contaminated packaging cannot be recycled',
      },
      {
        condition: 'chemical',
        overrideBin: GermanBin.SCHADSTOFFSAMMLUNG,
        reason: 'Chemical containers (paint, motor oil) require special disposal',
      },
    ],
  },

  // ---------------------------------------------------------
  // 2. PAPIER – clean paper & cardboard
  // ---------------------------------------------------------
  {
    bin: GermanBin.PAPIER,
    materials: ['paper', 'cardboard', 'corrugated', 'kraft'],
    keywords: [
      'box',
      'paper bag',
      'newspaper',
      'magazine',
      'envelope',
      'carton',
      'toilet roll',
      'shipping box',
    ],
    rules: [
      'Keep paper dry and clean',
      'Flatten boxes to optimize space',
      'Remove plastic windows or tape when possible',
      'Egg cartons and paper trays go here if clean',
      'No thermal paper (receipts) – they contain chemicals',
    ],
    exceptions: [
      {
        condition: 'greasy',
        overrideBin: GermanBin.RESTMUELL,
        reason: 'Food-soiled paper (e.g., pizza box bottom) is not recyclable',
      },
      {
        condition: 'plastic_coated',
        overrideBin: GermanBin.GELBER_SACK,
        reason: 'Paper with plastic coating belongs to Gelber Sack',
      },
    ],
  },

  // ---------------------------------------------------------
  // 3. GLAS – glass bottles and jars
  // ---------------------------------------------------------
  {
    bin: GermanBin.GLAS,
    materials: ['glass'],
    keywords: ['bottle', 'jar', 'glass container', 'wine bottle', 'beer bottle', 'olive jar'],
    rules: [
      'Sort by color: white (weiß), green, brown',
      'Remove metal lids – they go into Gelber Sack',
      'Rinse lightly to remove residue',
      'Labels can stay on',
      'No disposal outside quiet hours in many cities (noise rule)',
    ],
    exceptions: [
      {
        condition: 'heat_resistant',
        overrideBin: GermanBin.RESTMUELL,
        reason: 'Ceramics, Pyrex, oven-safe glass do NOT go into Glascontainer',
      },
      {
        condition: 'mirror',
        overrideBin: GermanBin.RESTMUELL,
        reason: 'Mirrors and window glass use different materials',
      },
    ],
  },

  // ---------------------------------------------------------
  // 4. BIOMÜLL – organic & food waste
  // ---------------------------------------------------------
  {
    bin: GermanBin.BIOMUELL,
    materials: ['organic', 'food', 'compost'],
    keywords: [
      'fruit',
      'vegetable',
      'eggshell',
      'coffee grounds',
      'tea bag',
      'peels',
      'plants',
      'flowers',
    ],
    rules: [
      'No plastic bags unless certified compostable',
      'Remove stickers from fruit/vegetables',
      'Small bones allowed in some regions; check city rules',
      'Only unprocessed or minimally processed organic material',
      'Chop large items for quicker composting',
    ],
    exceptions: [
      {
        condition: 'packaged',
        overrideBin: GermanBin.RESTMUELL,
        reason: 'Food still in packaging cannot go to Biomüll',
      },
      {
        condition: 'liquid',
        overrideBin: GermanBin.RESTMUELL,
        reason: 'Liquid waste does not belong in Biomüll',
      },
    ],
  },

  // ---------------------------------------------------------
  // 5. ELEKTROSCHROTT – electronics & batteries
  // ---------------------------------------------------------
  {
    bin: GermanBin.ELEKTROSCHROTT,
    materials: ['electronic', 'battery', 'circuit', 'lithium'],
    keywords: [
      'phone',
      'computer',
      'laptop',
      'battery',
      'cable',
      'charger',
      'appliance',
      'speaker',
      'remote',
    ],
    rules: [
      'Take electronics to designated collection points or recycling centers',
      'Supermarkets accept small electronics under 25 cm',
      'Batteries must be separated; supermarkets accept them for free',
      'Wipe personal data before disposal',
      'No electronics in Restmüll or Gelber Sack',
    ],
    exceptions: [
      {
        condition: 'damaged_battery',
        overrideBin: GermanBin.SCHADSTOFFSAMMLUNG,
        reason: 'Damaged lithium batteries require special handling due to fire risk',
      },
    ],
  },

  // ---------------------------------------------------------
  // 6. SPERRMÜLL – bulky waste (furniture, mattresses)
  // ---------------------------------------------------------
  {
    bin: GermanBin.SPERRMUELL,
    materials: ['furniture', 'large', 'wood', 'fabric', 'mattress'],
    keywords: [
      'sofa',
      'mattress',
      'chair',
      'table',
      'carpet',
      'shelf',
      'wardrobe',
      'furniture',
      'large item',
    ],
    rules: [
      'Schedule pickup through city services or recycling centers',
      'Disassemble large items when possible',
      'Keep items dry until pickup',
      'No electronics or hazardous waste in Sperrmüll',
      'Some cities offer 1–2 free pickups per year',
    ],
    exceptions: [
      {
        condition: 'hazardous',
        overrideBin: GermanBin.SCHADSTOFFSAMMLUNG,
        reason: 'Chemical-treated items may require special disposal',
      },
    ],
  },

  // ---------------------------------------------------------
  // 7. RESTMÜLL – non-recyclable waste
  // ---------------------------------------------------------
  {
    bin: GermanBin.RESTMUELL,
    materials: ['mixed', 'contaminated', 'ceramic', 'porcelain'],
    keywords: [
      'dirty',
      'mixed',
      'unclear',
      'sanitary',
      'diaper',
      'tissue',
      'ceramic',
      'porcelain',
      'broken plate',
    ],
    rules: [
      'Everything that cannot be recycled goes here',
      'Heavily contaminated recyclables belong here',
      'Ceramics, Pyrex, and porcelain go to Restmüll',
      'Vacuum cleaner bags and hygiene products go here',
      'Small objects made of multiple inseparable materials go here',
    ],
  },
];

const CITY_OVERRIDES: Record<string, CityOverride[]> = {
  berlin: [
    {
      city: 'Berlin',
      additionalRules: [
        'Berlin uses the orange Wertstofftonne, which accepts more materials than Gelber Sack',
        'Bio-waste collection is available in most districts but not mandatory',
        'Glass containers have noise restrictions: no disposal during quiet hours',
      ],
    },
  ],

  munich: [
    {
      city: 'Munich',
      additionalRules: [
        'Munich has strict contamination rules; improperly sorted bins may be rejected',
        'Biomüll requires biodegradable bags; plastic bags are prohibited',
        'Glass collection points have defined opening times to avoid noise complaints',
      ],
    },
  ],

  hamburg: [
    {
      city: 'Hamburg',
      additionalRules: [
        'City-wide Biomüll collection is standardized and mandatory',
        'The blue Papier bin accepts cardboard even if lightly stained (non-greasy)',
        'Hamburg allows larger items to be dropped off at recycling centers for free',
      ],
    },
  ],
};

export { CITY_OVERRIDES, RECYCLING_RULES };
