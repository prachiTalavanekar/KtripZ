import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function StopCard({ stop, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconWrap}>
        <Ionicons name="location" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{stop.name}</Text>
        {(stop.lat !== 0 || stop.lng !== 0) && (
          <Text style={styles.coords}>{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 14, marginBottom: 10, ...SHADOWS.card,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#0A1F4412',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  coords: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
});
