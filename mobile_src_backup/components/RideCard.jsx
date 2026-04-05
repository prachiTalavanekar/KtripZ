import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { format } from 'date-fns';

const RideCard = ({ ride, onPress }) => {
  const driver = ride.driverId;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <View style={styles.routeCol}>
          <Text style={styles.city}>{ride.origin?.name}</Text>
          <View style={styles.line} />
          <Text style={styles.city}>{ride.destination?.name}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.price}>₹{ride.pricePerSeat}</Text>
          <Text style={styles.seats}>{ride.availableSeats} seats left</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <View style={styles.driverRow}>
          {driver?.profileImage
            ? <Image source={{ uri: driver.profileImage }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{driver?.name?.[0]}</Text></View>
          }
          <Text style={styles.driverName}>{driver?.name}</Text>
          <Text style={styles.rating}>⭐ {driver?.rating || '—'}</Text>
        </View>
        <Text style={styles.time}>{format(new Date(ride.departureTime), 'dd MMM, hh:mm a')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, marginBottom: 12, ...SHADOWS.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeCol: { flex: 1 },
  city: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  line: { width: 2, height: 20, backgroundColor: COLORS.primary, marginLeft: 6, marginVertical: 4 },
  infoCol: { alignItems: 'flex-end' },
  price: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.primary },
  seats: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: SIZES.sm, fontWeight: '700' },
  driverName: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  rating: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  time: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});

export default RideCard;
