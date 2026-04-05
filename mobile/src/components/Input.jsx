import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Input = ({ label, error, style, ...props }) => (
  <View style={[styles.wrapper, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={COLORS.textSecondary}
      {...props}
    />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500', marginBottom: 6 },
  input: {
    height: 50,
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.error },
  error: { fontSize: SIZES.xs, color: COLORS.error, marginTop: 4 },
});

export default Input;
