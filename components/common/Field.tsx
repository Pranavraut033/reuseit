import {
  Controller,
  ControllerRenderProps,
  FieldValues,
  RegisterOptions,
  useFormContext,
} from 'react-hook-form';
import { TextInput as RNTextInput, Text, TextInputProps, View } from 'react-native';

import React from 'react';
import { clsx } from 'clsx';

type FieldProps<TValue extends FieldValues> = {
  name: string;
  rules?: Omit<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
  className?: string;
  children?: (props: ControllerRenderProps<TValue>) => React.ReactElement;
} & Omit<TextInputProps, 'onChange' | 'onBlur' | 'value' | 'ref' | 'children'>;

const Field: React.FC<FieldProps<FieldValues>> = ({
  name,
  rules,
  className,
  children,
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
          const { onChange, onBlur, value } = props.field;

          return (
            children?.(props.field) || (
              <RNTextInput
                className="rounded-lg border border-gray-300 p-4 focus:border-primary"
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
