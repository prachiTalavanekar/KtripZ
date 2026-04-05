import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { format } from 'date-fns';

export default function RideCard({ ride, onPress }) {
  const driver = ride.driverId;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.routePoints}>
          <View style={styles.dotGreen} />
          <View style={styles.routeLine} />
          <View style={styles.dotBlue} />
        </View>
        <View style={styles.routeNames}>
          <Text style={styles.city}>{ride.origin?.name}</Text>
          <Text style={styles.city}>{ride.destination?.name}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>₹{ride.pricePerSeat}</Text>
          <Text style={styles.perSeat}>per seat</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.driverRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{driver?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{driver?.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.rating}>{driver?.rating || '—'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.metaRight}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{ride.availableSeats} left</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{format(new Date(ride.departureTime), 'dd MMM, hh:mm a')}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 12, ...SHADOWS.card },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routePoints: { alignItems: 'center', gap: 2 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  routeLine: { width: 2, height: 22, backgroundColor: COLORS.border },
  dotBlue: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  routeNames: { flex: 1, justifyContent: 'space-between', gap: 14 },
  city: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.primary },
  perSeat: { fontSize: 10, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: SIZES.sm, fontWeight: '700' },
  driverName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 11, color: COLORS.textSecondary },
  metaRight: { alignItems: 'flex-end', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: COLORS.textSecondary },
});
