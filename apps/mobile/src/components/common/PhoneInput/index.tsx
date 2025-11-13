import * as RNLocalize from 'react-native-localize';

import React, { useCallback, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import CountrySelector from './CountrySelector';
import { Portal } from '@rn-primitives/portal';
import countries from '~/src/json/countries.json';

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

      <Portal name="countrySelector">
        <CountrySelector
          visible={showSelector}
          currentCountryCode={selectedCountry.code}
          onSelect={handleCountrySelect}
          onClose={() => setShowSelector(false)}
        />
      </Portal>
    </>
  );
};


export default PhoneInput;
