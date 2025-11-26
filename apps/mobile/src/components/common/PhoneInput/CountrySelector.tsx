import { AntDesign } from '@expo/vector-icons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useMemo, useRef, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import useAppConfig from '~/hooks/useAppConfig';
import countries from '~/json/countries.json';
import cn from '~/utils/cn';

import { Country } from '.';

type CountrySelectorProps = {
  visible: boolean;
  currentCountryCode?: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
};

const getFlagEmoji = (countryCode: string) => {
  return countryCode
    .toUpperCase()
    .split('')
    .map((char: string) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

const CountrySelector: React.FC<CountrySelectorProps> = ({
  visible,
  onSelect,
  onClose,
  currentCountryCode,
}) => {
  const sheetRef = useRef<BottomSheet>(null);
  const [searchText, setSearchText] = useState('');

  const filteredCountries = useMemo<Country[]>(() => {
    const search = searchText.trim().toLowerCase();
    return search
      ? countries.filter(
          (c) =>
            c.name.toLowerCase().includes(search) || c.dial_code.toLowerCase().includes(search),
        )
      : countries;
  }, [searchText]);

  const { primaryColor } = useAppConfig();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={sheetRef}
          snapPoints={['40%', '70%', '100%']}
          enableDynamicSizing={false}
          backgroundStyle={{
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
          enablePanDownToClose
          handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
          backdropComponent={({ style }) => (
            <TouchableOpacity
              style={[style, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
              activeOpacity={1}
              onPress={onClose}
            />
          )}
          onClose={onClose}
        >
          <View className="flex-1 bg-white">
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-4">
              <Text className="text-lg font-semibold text-gray-900">Select Country</Text>
              <TouchableOpacity
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                onPress={onClose}
              >
                <Text className="text-lg text-gray-600">×</Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 py-3">
              <View className="flex-row items-center rounded-lg bg-gray-50 px-3 py-2">
                <Text className="mr-2 text-gray-400">🔍</Text>
                <TextInput
                  className="flex-1 text-gray-900"
                  placeholder="Search country or code"
                  placeholderTextColor="#9CA3AF"
                  textContentType="countryName"
                  onChangeText={setSearchText}
                  value={searchText}
                />
              </View>
            </View>
            <BottomSheetFlatList
              data={filteredCountries}
              keyExtractor={(item: Country) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: Country }) => (
                <TouchableOpacity
                  className={cn(
                    'flex-row items-center border-b border-gray-100 px-4 py-3 active:bg-gray-50',
                    {
                      'bg-black/5': item.code === currentCountryCode,
                    },
                  )}
                  onPress={() => onSelect(item)}
                >
                  <Text className="mr-3 text-2xl">{getFlagEmoji(item.code)}</Text>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{item.name}</Text>
                    <Text className="text-sm text-gray-500">{item.dial_code}</Text>
                  </View>
                  {item.code === currentCountryCode && (
                    <AntDesign name="check" size={16} color={primaryColor} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default CountrySelector;
