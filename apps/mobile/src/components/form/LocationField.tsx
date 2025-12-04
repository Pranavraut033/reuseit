import React from 'react';
import { Text, View } from 'react-native';

import { LocationPicker } from '../post/LocationPicker';
import Field from './Field';

type LocationFieldProps = {
  name: string;
  label?: string;
  rules?: any;
  className?: string;
};

const LocationField: React.FC<LocationFieldProps> = ({
  name,
  label = 'Location',
  rules,
  className,
}) => {
  return (
    <View className={`mb-4 ${className || ''}`}>
      <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      <Field name={name} rules={rules}>
        {({ onChange, value }) => <LocationPicker location={value} onLocationChange={onChange} />}
      </Field>
    </View>
  );
};

export default LocationField;
