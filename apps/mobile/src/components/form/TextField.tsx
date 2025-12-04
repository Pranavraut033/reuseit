import { clsx } from 'clsx';
import React from 'react';
import { Text, TextInputProps, View } from 'react-native';

import cn from '~/utils/cn';

import Field from './Field';

/**
 * TextField component for form inputs
 *
 * @example
 * // String input (default)
 * <TextField name="username" label="Username" placeholder="Enter username" />
 *
 * // Number input
 * <TextField
 *   name="age"
 *   label="Age"
 *   placeholder="Enter age"
 *   valueType="number"
 *   rules={{ min: { value: 0, message: "Age must be positive" } }}
 * />
 */
type TextFieldProps = {
  name: string;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  rules?: any;
  className?: string;
  inputClassName?: string;
  valueType?: 'string' | 'number';
} & Omit<TextInputProps, 'onChange' | 'onBlur' | 'value' | 'ref' | 'children'>;

const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  placeholder,
  multiline = false,
  numberOfLines,
  rules,
  className,
  inputClassName,
  valueType = 'string',
  ...rest
}) => {
  return (
    <View className={clsx('mb-4', className)}>
      {!!label && <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>}
      <Field
        name={name}
        rules={rules}
        valueType={valueType}
        inputClassName={cn(
          'rounded-lg border border-gray-300 px-4 py-3 focus:border-primary',
          multiline && 'text-align-vertical-top',
          inputClassName,
        )}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...rest}
      />
    </View>
  );
};

export default TextField;
