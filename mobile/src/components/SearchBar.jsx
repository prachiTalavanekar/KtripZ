import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

export default function SearchBar({ value, onChangeText, onClear, placeholder = 'Search...' }) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="words"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  input: {
    flex: 1, fontSize: SIZES.base, color: COLORS.text, padding: 0,
  },
});
