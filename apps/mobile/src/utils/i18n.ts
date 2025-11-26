import { getLocales } from 'react-native-localize';

export type Language = 'en' | 'de';

export const getCurrentLanguage = (): Language => {
  const locales = getLocales();
  const primaryLanguage = locales[0]?.languageCode;
  return primaryLanguage === 'de' ? 'de' : 'en';
};

const translations_en = {
  explore: {
    title: 'Explore Nearby',
    subtitle: 'Discover local recycling centers and resources.',
    loading: 'Loading nearby places...',
    directions: 'Directions',
    close: 'Close',
    filterAll: 'All',
    tooltipCurrentLocation: 'Go to Current Location',
    categories: {
      general: 'General',
      glass: 'Glass',
      paper: 'Paper',
      plastic: 'Plastic',
      clothes: 'Clothes',
      electronics: 'Electronics',
      batteries: 'Batteries',
      metal: 'Metal',
      bulkyWaste: 'Bulky Waste',
    },
  },
  postCreate: {
    addPhotos: 'Add Photos',
    anonymous: 'Anonymous',
    cancel: 'Cancel',
    category: 'Category',
    categoryPlaceholder: 'Select a category',
    categoryRequired: 'Category is required',
    chooseFromLibrary: 'Choose from Library',
    condition: 'Condition',
    conditionRequired: 'Condition is required',
    deletePhoto: 'Delete photo',
    description: 'Description',
    descriptionMaxLength: 'Description must be less than 1000 characters',
    descriptionPlaceholder: 'Describe your item...',
    descriptionRequired: 'Description is required',
    discard: 'Discard',
    discardMessage: 'Are you sure you want to discard this post?',
    discardTitle: 'Discard Post?',
    educationTips: 'Education Tips',
    enterManually: 'Enter Manually',
    error: 'Failed to publish post',
    keepEditing: 'Keep Editing',
    location: 'Location',
    locationErrorTitle: 'Location Error',
    locationErrorMessage: 'Unable to get your current location. Please try again.',
    locationOptional: 'Location (optional)',
    notAnonymous: 'Not Anonymous',
    offline: 'Post saved offline. Will publish when online.',
    photosLimit: 'Up to 4 photos',
    pickupDate: 'Pickup Date',
    pickupDateOptional: 'Pickup Date (optional)',
    preview: 'Preview',
    publish: 'Publish',
    publishing: 'Publishing...',
    reorderPhotos: 'Drag to reorder',
    selectOnMap: 'Select on Map',
    success: 'Post published successfully!',
    tags: 'Tags',
    tagsPlaceholder: 'Add tags...',
    takePhoto: 'Take Photo',
    tip1: 'Add clear photos to increase interest',
    tip2: 'Accurate descriptions help others',
    tip3: 'Tags make your item easier to find',
    title: 'Create Post',
    titleMaxLength: 'Title must be less than 100 characters',
    titleMinLength: 'Title must be at least 3 characters',
    titlePlaceholder: 'Give your item a title',
    titleRequired: 'Title is required',
    uploadingImages: 'Uploading images...',
    useCurrentLocation: 'Use Current Location',
  },
  categories: {
    books: 'Books',
    clothing: 'Clothing',
    electronics: 'Electronics',
    furniture: 'Furniture',
    homeGoods: 'Home Goods',
    other: 'Other',
    sports: 'Sports & Outdoors',
    toys: 'Toys',
  },
  conditions: {
    fair: 'Fair',
    good: 'Good',
    likeNew: 'Like New',
    new: 'New',
    used: 'Used',
  },
  berlinTags: {
    circular: 'Circular Economy',
    donation: 'Donation',
    ecofriendly: 'Eco-Friendly',
    free: 'Free',
    recycling: 'Recycling',
    reuse: 'Reuse',
    sustainable: 'Sustainable',
    swap: 'Swap',
    upcycle: 'Upcycle',
    zerowaste: 'Zero Waste',
  },
  accessibility: {
    addPhotoButton: 'Add photo button',
    anonymousToggle: 'Toggle anonymous posting',
    cancelButton: 'Cancel post creation button',
    categoryPicker: 'Category picker',
    conditionPicker: 'Condition picker',
    datePickerButton: 'Pickup date picker button',
    descriptionInput: 'Item description input',
    dragHandle: 'Drag to reorder image',
    locationButton: 'Location selection button',
    previewCard: 'Post preview card',
    publishButton: 'Publish post button',
    removePhotoButton: 'Remove photo button',
    tagInput: 'Tag input',
    titleInput: 'Item title input',
  },
} as const;

type Widen<T> = {
  [K in keyof T]: T[K] extends object ? Widen<T[K]> : string;
};

export type TranslationObject = Widen<typeof translations_en>;

type TranslationKey<T = TranslationObject> = {
  [K in keyof T & string]: T[K] extends string
    ? `${K}` // leaf
    : `${K}` | `${K}.${TranslationKey<T[K]>}`; // nested
}[keyof T & string];

export const translations: Record<string, TranslationObject> = {
  en: translations_en,
  de: {
    explore: {
      title: 'In der Nähe erkunden',
      subtitle: 'Entdecken Sie lokale Recyclingzentren und Ressourcen.',
      loading: 'Lade Orte in deiner Nähe...',
      directions: 'Route',
      close: 'Schließen',
      filterAll: 'Alle',
      tooltipCurrentLocation: 'Zum aktuellen Standort gehen',
      categories: {
        general: 'Allgemein',
        glass: 'Glas',
        paper: 'Papier',
        plastic: 'Plastik',
        clothes: 'Kleidung',
        electronics: 'Elektronik',
        batteries: 'Batterien',
        metal: 'Metall',
        bulkyWaste: 'Sperrmüll',
      },
    },
    postCreate: {
      addPhotos: 'Fotos hinzufügen',
      anonymous: 'Anonym',
      cancel: 'Abbrechen',
      category: 'Kategorie',
      categoryPlaceholder: 'Kategorie auswählen',
      categoryRequired: 'Kategorie ist erforderlich',
      chooseFromLibrary: 'Aus Bibliothek wählen',
      condition: 'Zustand',
      conditionRequired: 'Zustand ist erforderlich',
      deletePhoto: 'Foto löschen',
      description: 'Beschreibung',
      descriptionMaxLength: 'Beschreibung muss weniger als 1000 Zeichen lang sein',
      descriptionPlaceholder: 'Beschreiben Sie Ihren Artikel...',
      descriptionRequired: 'Beschreibung ist erforderlich',
      discard: 'Verwerfen',
      discardMessage: 'Möchten Sie diesen Beitrag wirklich verwerfen?',
      discardTitle: 'Beitrag verwerfen?',
      educationTips: 'Bildungstipps',
      enterManually: 'Manuell eingeben',
      error: 'Beitrag konnte nicht veröffentlicht werden',
      keepEditing: 'Weiter bearbeiten',
      location: 'Standort',
      locationErrorTitle: 'Standortfehler',
      locationErrorMessage:
        'Ihr aktueller Standort konnte nicht abgerufen werden. Bitte versuchen Sie es erneut.',
      locationOptional: 'Standort (optional)',
      notAnonymous: 'Nicht anonym',
      offline: 'Beitrag offline gespeichert. Wird veröffentlicht, wenn online.',
      photosLimit: 'Bis zu 4 Fotos',
      pickupDate: 'Abholdatum',
      pickupDateOptional: 'Abholdatum (optional)',
      preview: 'Vorschau',
      publish: 'Veröffentlichen',
      publishing: 'Veröffentlichen...',
      reorderPhotos: 'Zum Neuordnen ziehen',
      selectOnMap: 'Auf Karte auswählen',
      success: 'Beitrag erfolgreich veröffentlicht!',
      tags: 'Tags',
      tagsPlaceholder: 'Tags hinzufügen...',
      takePhoto: 'Foto aufnehmen',
      tip1: 'Fügen Sie klare Fotos hinzu, um das Interesse zu erhöhen',
      tip2: 'Genaue Beschreibungen helfen anderen',
      tip3: 'Tags machen Ihren Artikel leichter auffindbar',
      title: 'Beitrag erstellen',
      titleMaxLength: 'Titel muss weniger als 100 Zeichen lang sein',
      titleMinLength: 'Titel muss mindestens 3 Zeichen lang sein',
      titlePlaceholder: 'Geben Sie Ihrem Artikel einen Titel',
      titleRequired: 'Titel ist erforderlich',
      uploadingImages: 'Bilder hochladen...',
      useCurrentLocation: 'Aktuellen Standort verwenden',
    },
    categories: {
      books: 'Bücher',
      clothing: 'Kleidung',
      electronics: 'Elektronik',
      furniture: 'Möbel',
      homeGoods: 'Haushaltswaren',
      other: 'Sonstiges',
      sports: 'Sport & Outdoor',
      toys: 'Spielzeug',
    },
    conditions: {
      fair: 'Akzeptabel',
      good: 'Gut',
      likeNew: 'Wie neu',
      new: 'Neu',
      used: 'Gebraucht',
    },
    berlinTags: {
      circular: 'Kreislaufwirtschaft',
      donation: 'Spende',
      ecofriendly: 'Umweltfreundlich',
      free: 'Kostenlos',
      recycling: 'Recycling',
      reuse: 'Wiederverwenden',
      sustainable: 'Nachhaltig',
      swap: 'Tauschen',
      upcycle: 'Upcycling',
      zerowaste: 'Zero Waste',
    },
    accessibility: {
      addPhotoButton: 'Foto hinzufügen Schaltfläche',
      anonymousToggle: 'Anonymes Posten umschalten',
      cancelButton: 'Beitragserstellung abbrechen Schaltfläche',
      categoryPicker: 'Kategorieauswahl',
      conditionPicker: 'Zustandsauswahl',
      datePickerButton: 'Abholdatum Auswahl Schaltfläche',
      descriptionInput: 'Artikelbeschreibungs-Eingabe',
      dragHandle: 'Zum Neuordnen des Bildes ziehen',
      locationButton: 'Standortauswahl Schaltfläche',
      previewCard: 'Beitragsvorschau-Karte',
      publishButton: 'Beitrag veröffentlichen Schaltfläche',
      removePhotoButton: 'Foto entfernen Schaltfläche',
      tagInput: 'Tag-Eingabe',
      titleInput: 'Artikeltitel-Eingabe',
    },
  },
};

export const t = (key: TranslationKey, lang?: Language): string => {
  const language = lang || getCurrentLanguage();
  const keys = key.split('.');
  let value: Record<string, unknown> | string = translations[language];

  for (const k of keys) {
    if (typeof value === 'string') break;
    value = (value as Record<string, unknown>)?.[k] as Record<string, unknown> | string;
  }

  return typeof value === 'string' ? value : key;
};
