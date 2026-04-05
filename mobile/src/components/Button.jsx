import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Button = ({ title, onPress, loading, variant = 'primary', style, textStyle, disabled }) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.btn, isPrimary ? styles.primary : styles.outline, (loading || disabled) && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? COLORS.secondary : COLORS.primary} />
        : <Text style={[styles.text, !isPrimary && styles.outlineText, textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primary: { backgroundColor: COLORS.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
  disabled: { opacity: 0.6 },
  text: { color: COLORS.secondary, fontSize: SIZES.base, fontWeight: '600' },
  outlineText: { color: COLORS.primary },
});

export default Button;
