import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyBookings } from '../../store/slices/bookingSlice';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending:   { color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  approved:  { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  rejected:  { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6', icon: 'ban-outline' },
  completed: { color: '#3B82F6', bg: '#DBEAFE', icon: 'flag-outline' },
};

function BookingCard({ booking, onPress }) {
  const ride = booking.rideId;
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.routeWrap}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.route} numberOfLines={1}>{ride?.origin?.name} → {ride?.destination?.name}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={12} color={cfg.color} />
          <Text style={[styles.badgeText, { color: cfg.color }]}>{booking.status}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {ride?.departureTime ? format(new Date(ride.departureTime), 'dd MMM, hh:mm a') : '—'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{booking.seatsBooked} seat(s)</Text>
        </View>
        <Text style={styles.amount}>₹{booking.totalAmount}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MyBookingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.bookings);

  useEffect(() => { dispatch(fetchMyBookings()); }, []);

  return (
    <View style={styles.root}>
      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        : <FlatList
            data={list}
            keyExtractor={i => i._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <BookingCard booking={item}
                onPress={() => navigation.getParent()?.navigate('Chat', { bookingId: item._id, driverId: item.rideId?.driverId })} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={52} color={COLORS.border} />
                <Text style={styles.emptyText}>No bookings yet</Text>
              </View>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 12, ...SHADOWS.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  routeWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  route: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text, flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  amount: { marginLeft: 'auto', fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textSecondary },
});
