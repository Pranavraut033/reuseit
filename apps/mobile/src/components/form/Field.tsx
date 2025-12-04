import { clsx } from 'clsx';
import React from 'react';
import {
  Controller,
  ControllerRenderProps,
  FieldValues,
  RegisterOptions,
  useFormContext,
} from 'react-hook-form';
import { Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native';

import cn from '~/utils/cn';

type FieldProps = {
  children?: (props: ControllerRenderProps<FieldValues>) => React.ReactElement;
  className?: string;
  inputClassName?: string;
  name: string;
  rules?: RegisterOptions;
  valueType?: 'string' | 'number';
} & Pick<
  TextInputProps,
  Exclude<keyof TextInputProps, 'onChange' | 'onBlur' | 'value' | 'ref' | 'children'>
>;

const Field: React.FC<FieldProps> = ({
  children,
  className,
  inputClassName,
  name,
  rules,
  valueType = 'string',
  ...rest
}) => {
  const context = useFormContext();

  if (!context) throw new Error('Field must be used within a FormProvider');

  const {
    control,
    formState: { errors },
  } = context;

  return (
    <View className={clsx('flex flex-col', className)}>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={(props) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const { onChange, onBlur, value: _v } = props.field;

          // Convert value to string for TextInput display
          const displayValue =
            valueType === 'number' ? (_v != null ? String(_v) : '') : (_v as string) || '';

          // Handle change based on valueType
          const handleChangeText = (text: string) => {
            if (valueType === 'number') {
              const numValue = text === '' ? undefined : parseFloat(text);
              onChange(isNaN(numValue as number) ? 0 : numValue);
            } else {
              onChange(text);
            }
          };

          return (
            children?.(props.field) || (
              <RNTextInput
                className={cn(
                  'rounded-lg border border-gray-300 p-4 focus:border-primary',
                  inputClassName,
                )}
                onBlur={onBlur}
                onChangeText={handleChangeText}
                value={displayValue}
                keyboardType={valueType === 'number' ? 'numeric' : rest.keyboardType}
                {...rest}
              />
            )
          );
        }}
      />
      {errors[name] && (
        <Text className="mt-2 text-xs text-red-500">{errors[name]?.message as string}</Text>
      )}
    </View>
  );
};

export default Field;
