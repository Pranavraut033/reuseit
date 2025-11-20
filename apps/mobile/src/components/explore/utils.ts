/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export const RECYCLING_KEYWORDS = {
  general: ['Recycling', 'Recycling Center', 'Recyclingzentrum', 'Wertstoffhof', 'Recyclinghof'],
  glass: ['Altglascontainer', 'Glass recycling', 'Glass container'],
  paper: ['Altpapiercontainer', 'Paper recycling', 'Paper container'],
  plastic: ['Wertstoffcontainer', 'Packaging recycling'],
  clothes: ['Altkleidercontainer', 'Clothes recycling', 'Textile recycling'],
  electronics: [
    'Elektroschrott',
    'Batterie Sammelstelle',
    'Electronic waste',
    'E-waste recycling',
    'Battery recycling',
    'Battery drop-off',
  ],
  metal: ['Metallschrott', 'Scrap metal'],
  bulkyWaste: ['Sperrmüll', 'Bulky waste drop-off'],
};

export type CategoryKey = keyof typeof RECYCLING_KEYWORDS;

export const CATEGORY_IMAGES: Record<CategoryKey | 'all', { uri: string }> = {
  all: require('~/assets/icons/waste-category/all.png'),
  general: require('~/assets/icons/waste-category/general.png'),
  glass: require('~/assets/icons/waste-category/glass.png'),
  paper: require('~/assets/icons/waste-category/paper.png'),
  plastic: require('~/assets/icons/waste-category/plastic.png'),
  clothes: require('~/assets/icons/waste-category/clothes.png'),
  electronics: require('~/assets/icons/waste-category/electronics.png'),
  // batteries: require('~/assets/icons/waste-category/electronics.png'), // add battery icon
  metal: require('~/assets/icons/waste-category/metal.png'),
  bulkyWaste: require('~/assets/icons/waste-category/bulky.png'),
};
