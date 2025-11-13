import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";

import { Country } from ".";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import countries from '~/src/json/countries.json';
import { AntDesign } from "@expo/vector-icons";
import useAppConfig from "~/src/hooks/useAppConfig";
import cn from "~/src/utils/cn";

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

const CountrySelector: React.FC<CountrySelectorProps> = ({ visible, onSelect, onClose, currentCountryCode }) => {
  const sheetRef = useRef<BottomSheet>(null);
  const [searchText, setSearchText] = useState('');

  const filteredCountries = useMemo<Country[]>(() => {
    const search = searchText.trim().toLowerCase();
    return search
      ? countries.filter(
        (c) => c.name.toLowerCase().includes(search) || c.dial_code.toLowerCase().includes(search)
      )
      : countries;
  }, [searchText]);

  useEffect(() => {
    if (visible) sheetRef.current?.expand();
    else {
      setSearchText('');
      sheetRef.current?.close();
    }
  }, [visible]);
  const { primaryColor } = useAppConfig();

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={sheetRef}
          snapPoints={['40%', '70%', '100%']}
          enableDynamicSizing={false}
          backgroundStyle={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
          backdropComponent={({ style }) => (
            <TouchableOpacity
              style={[style, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              activeOpacity={1}
              onPress={onClose}
            />
          )}
          onChange={() => { }}>
          <View className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">Select Country</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                onPress={onClose}>
                <Text className="text-gray-600 text-lg">×</Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 py-3">
              <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2">
                <Text className="text-gray-400 mr-2">🔍</Text>
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
                  className={cn("flex-row items-center px-4 py-3 border-b border-gray-100 active:bg-gray-50", {
                    'bg-black/5': item.code === currentCountryCode,
                  })}
                  onPress={() => onSelect(item)}>
                  <Text className="text-2xl mr-3">{getFlagEmoji(item.code)}</Text>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">{item.name}</Text>
                    <Text className="text-gray-500 text-sm">{item.dial_code}</Text>
                  </View>
                  {
                    item.code === currentCountryCode && (
                      <AntDesign name="check" size={16} color={primaryColor} />
                    )
                  }
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