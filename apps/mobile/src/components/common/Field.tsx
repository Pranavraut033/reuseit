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

type FieldProps<TValue extends FieldValues> = {
  children?: (props: ControllerRenderProps<TValue>) => React.ReactElement;
  className?: string;
  inputClassName?: string;
  name: string;
  rules?: Omit<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
} & Omit<TextInputProps, 'onChange' | 'onBlur' | 'value' | 'ref' | 'children'>;

const Field: React.FC<FieldProps<FieldValues>> = ({
  children,
  className,
  inputClassName,
  name,
  rules,
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
          const value = _v as string;

          return (
            children?.(props.field) || (
              <RNTextInput
                className={cn(
                  'rounded-lg border border-gray-300 p-4 focus:border-primary',
                  inputClassName,
                )}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
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
