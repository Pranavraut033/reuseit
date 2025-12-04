import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';

import Field from './Field';

type DateTimeFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  minimumDate?: Date;
  rules?: any;
  className?: string;
};

const DateTimeField: React.FC<DateTimeFieldProps> = ({
  name,
  label,
  placeholder = 'Select date and time',
  minimumDate,
  rules,
  className,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  if (Platform.OS === 'android') {
    return (
      <View className={`mb-4 ${className || ''}`}>
        <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
        <Field name={name} rules={rules}>
          {({ onChange, value }) => (
            <>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 flex-row items-center gap-3 rounded-lg border border-gray-300 px-4 py-3"
                  onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text className="text-base text-gray-800">
                    {(value as Date) ? format(value as Date, 'MMM dd, yyyy') : 'Select date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 flex-row items-center gap-3 rounded-lg border border-gray-300 px-4 py-3"
                  onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text className="text-base text-gray-800">
                    {(value as Date) ? format(value as Date, 'HH:mm') : 'Select time'}
                  </Text>
                </TouchableOpacity>
              </View>

              <DatePicker
                modal
                open={showDatePicker}
                date={(value as Date) || new Date()}
                mode="date"
                minimumDate={minimumDate}
                onConfirm={(selectedDate) => {
                  const currentValue = (value as Date) || new Date();
                  const newDate = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    currentValue.getHours(),
                    currentValue.getMinutes(),
                  );
                  onChange(newDate);
                  setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
              />

              <DatePicker
                modal
                open={showTimePicker}
                date={(value as Date) || new Date()}
                mode="time"
                onConfirm={(selectedTime) => {
                  const currentValue = (value as Date) || new Date();
                  const newDate = new Date(
                    currentValue.getFullYear(),
                    currentValue.getMonth(),
                    currentValue.getDate(),
                    selectedTime.getHours(),
                    selectedTime.getMinutes(),
                  );
                  onChange(newDate);
                  setShowTimePicker(false);
                }}
                onCancel={() => setShowTimePicker(false)}
              />
            </>
          )}
        </Field>
      </View>
    );
  } else {
    return (
      <View className={`mb-4 ${className || ''}`}>
        <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
        <Field name={name} rules={rules}>
          {({ onChange, value }) => (
            <>
              <TouchableOpacity
                className="flex-row items-center gap-3 rounded-lg border border-gray-300 px-4 py-3"
                onPress={() => setShowPicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text className="text-base text-gray-800">
                  {(value as Date) ? format(value as Date, 'MMM dd, yyyy HH:mm') : placeholder}
                </Text>
              </TouchableOpacity>

              <DatePicker
                modal
                open={showPicker}
                date={(value as Date) || new Date()}
                mode="datetime"
                minimumDate={minimumDate}
                onConfirm={(selectedDate) => {
                  onChange(selectedDate);
                  setShowPicker(false);
                }}
                onCancel={() => setShowPicker(false)}
              />
            </>
          )}
        </Field>
      </View>
    );
  }
};

export default DateTimeField;
