import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBookings } from '../../store/slices/bookingSlice';
import Header from '../../components/Header';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

const STATUS_COLORS = {
  pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444',
  cancelled: '#6B7280', completed: '#3B82F6',
};

const BookingCard = ({ booking, onPress }) => {
  const ride = booking.rideId;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Text style={styles.route}>{ride?.origin?.name} → {ride?.destination?.name}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[booking.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[booking.status] }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>{ride?.departureTime ? format(new Date(ride.departureTime), 'dd MMM yyyy, hh:mm a') : '—'}</Text>
      <View style={styles.footer}>
        <Text style={styles.seats}>{booking.seatsBooked} seat(s)</Text>
        <Text style={styles.amount}>₹{booking.totalAmount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const MyBookingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.bookings);

  useEffect(() => { dispatch(fetchMyBookings()); }, []);

  return (
    <View style={styles.container}>
      <Header title="My Bookings" showBack={false} />
      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        : <FlatList
            data={list}
            keyExtractor={i => i._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <BookingCard booking={item}
                onPress={() => navigation.navigate('Chat', { bookingId: item._id, driverId: item.rideId?.driverId })} />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
          />
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, marginBottom: 12, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  route: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: SIZES.xs, fontWeight: '700' },
  date: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  seats: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  amount: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60, fontSize: SIZES.base },
});

export default MyBookingsScreen;
