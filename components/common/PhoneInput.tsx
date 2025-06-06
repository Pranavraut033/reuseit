import * as RNLocalize from 'react-native-localize';

import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Portal } from '@gorhom/portal';
import countries from '../../json/countries.json';

export type Country = (typeof countries)[0];

type PhoneInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onCountrySelect?: (country: Country) => void;
  placeholder?: string;
  country?: Country;
} & React.ComponentProps<typeof TextInput>;

const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChange,
  country,
  onCountrySelect,
  onBlur,
  placeholder = 'Enter phone number',
  ...rest
}) => {
  const defaultCountry = useMemo(() => {
    const userCountryCode = RNLocalize.getLocales()?.[0]?.countryCode;
    return (
      countries.find((c) => c.code === userCountryCode) ??
      countries.find((c) => c.code === 'DE') ??
      countries[0]
    );
  }, []);

  const [selectedCountry, setSelectedCountry] = useState<Country>(country ?? defaultCountry);
  const [showSelector, setShowSelector] = useState(false);

  const handleCountrySelect = useCallback(
    (c: Country) => {
      setSelectedCountry(c);
      onCountrySelect?.(c);
      setShowSelector(false);
    },
    [onCountrySelect]
  );

  const handlePhoneChange = useCallback(
    (text: string) => {
      onChange?.(text);
      onCountrySelect?.(selectedCountry);
    },
    [onChange, onCountrySelect, selectedCountry]
  );

  return (
    <>
      <View className="w-full flex-col items-center ">
        <View className="flex flex-row items-center rounded-lg border border-gray-300 focus-within:border-primary">
          <TouchableOpacity
            className="border-r border-gray-300 px-4 py-2"
            onPress={() => setShowSelector(true)}>
            <Text className="text-gray-700">{selectedCountry.dial_code}</Text>
          </TouchableOpacity>
          <TextInput
            className="flex-1 p-4"
            placeholder={placeholder}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            inputMode="numeric"
            returnKeyType="done"
            value={value}
            onChangeText={handlePhoneChange}
            {...rest}
          />
        </View>
      </View>

      <Portal>
        <CountrySelector
          visible={showSelector}
          onSelect={handleCountrySelect}
          onClose={() => setShowSelector(false)}
        />
      </Portal>
    </>
  );
};

type CountrySelectorProps = {
  visible: boolean;
  onSelect: (country: Country) => void;
  onClose: () => void;
};

const CountrySelector: React.FC<CountrySelectorProps> = ({ visible, onSelect, onClose }) => {
  const sheetRef = useRef<BottomSheet>(null);
  const [searchText, setSearchText] = useState('');

  const filteredCountries = useMemo(() => {
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

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheet
            ref={sheetRef}
            snapPoints={['30%', '60%', '100%']}
            enableDynamicSizing={false}
            onChange={() => {}}>
            <View className="w-full p-4">
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Search country"
                textContentType="countryName"
                onChangeText={setSearchText}
              />
            </View>
            <View className="mt-2 w-full rounded-lg border border-gray-300 bg-white">
              <BottomSheetFlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="border-b border-gray-300 px-4 py-2"
                    onPress={() => onSelect(item)}>
                    <Text className="text-gray-700">{`${item.name} (${item.dial_code})`}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <TouchableOpacity
              className="absolute right-4 top-4 rounded-full bg-gray-200 p-2"
              onPress={onClose}>
              <Text className="text-gray-700">Clear</Text>
            </TouchableOpacity>
          </BottomSheet>
        </GestureHandlerRootView>
      </TouchableOpacity>
    </Modal>
  );
};

export default PhoneInput;
