import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Region } from 'react-native-maps';

import {
  AutocompletePrediction,
  PlaceDetailsResult,
  useGenerateSessionToken,
  usePlaceDetails,
  usePlacesAutocomplete,
} from '~/hooks/GoogleMaps';

interface LocationAutocompleteProps {
  onSelect: (details: PlaceDetailsResult) => void;
  placeholder?: string;
  initialQuery?: string;
  locBias?: Region;
  debounceMs?: number;
  sessionToken?: string; // provide to group requests; will auto-generate if omitted
  inputClassName?: string;
  containerClassName?: string;
}

// Removed duplicate interface definition for PredictionItem

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  onSelect,
  placeholder = 'Search places',
  initialQuery = '',
  locBias,
  debounceMs = 300,
  sessionToken,
  inputClassName = 'flex-1 p-3 rounded-xl bg-blue-50 text-gray-800',
  containerClassName = 'mt-2',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [internalToken, setInternalToken] = useState<string | undefined>(sessionToken);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { placesAutocomplete: runAutocompleteQuery } = usePlacesAutocomplete();
  const { fetchPlaceDetails: fetchDetailsQuery } = usePlaceDetails();
  const { generateSessionToken: generateToken } = useGenerateSessionToken();

  // Initialize session token on mount if not provided
  useEffect(() => {
    if (!sessionToken && !internalToken) {
      generateToken().then(setInternalToken);
    }
  }, [sessionToken, internalToken, generateToken]);

  // regenerate session token when query cleared completely
  useEffect(() => {
    if (!query.trim()) {
      generateToken().then(setInternalToken);
      setPredictions([]);
    }
  }, [query, generateToken]);

  const runAutocomplete = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setPredictions([]);
        return;
      }
      setLoading(true);
      const preds = await runAutocompleteQuery({
        input: text,
        loc: locBias,
        sessionToken: internalToken,
      });
      setPredictions(preds);
      setLoading(false);
    },
    [locBias, internalToken, runAutocompleteQuery],
  );

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runAutocomplete(text), debounceMs);
  };

  const handleSelect = useCallback(
    async (place_id: string) => {
      setLoading(true);
      const details = await fetchDetailsQuery(place_id, internalToken);
      setLoading(false);
      if (details) {
        onSelect(details);
        // keep the chosen place in input for clarity
        setQuery(details.formatted_address || details.name);
        setPredictions([]); // collapse list
      }
    },
    [internalToken, onSelect, fetchDetailsQuery],
  );

  const renderItem = ({ item }: { item: AutocompletePrediction }) => (
    <TouchableOpacity
      className="flex-row items-start gap-2 px-3 py-2"
      onPress={() => handleSelect(item.place_id)}
      accessibilityRole="button"
      accessibilityLabel={item.description}
    >
      <Ionicons name="location-outline" size={18} color="#3B82F6" style={{ marginTop: 2 }} />
      <View className="flex-1">
        <Text className="text-sm text-gray-800" numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className={containerClassName}>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={query}
          onChangeText={onChangeText}
          placeholder={placeholder}
          className={inputClassName}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel={placeholder}
        />
        {loading && <ActivityIndicator size="small" color="#3B82F6" />}
      </View>
      {predictions.length > 0 && (
        <View className="mt-2 overflow-hidden rounded-xl border border-black/10 bg-white shadow">
          <FlatList
            data={predictions}
            keyExtractor={(p) => p.place_id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

export default LocationAutocomplete;
