import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { createBooking } from '../../store/slices/bookingSlice';
import api from '../../services/api';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

export default function RideDetailsScreen({ route, navigation }) {
  const { rideId } = route.params;
  const dispatch = useDispatch();
  const [ride, setRide] = useState(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/rides/${rideId}`).then(setRide).catch(console.error);
  }, [rideId]);

  const handleBook = async () => {
    setLoading(true);
    const result = await dispatch(createBooking({ rideId, seatsBooked: seats }));
    setLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      Alert.alert('Booking Sent', 'Waiting for driver approval', [
        { text: 'View Bookings', onPress: () => navigation.navigate('MyBookings') },
      ]);
    } else {
      Alert.alert('Error', result.payload);
    }
  };

  if (!ride) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  const driver = ride.driverId;
  const vehicle = ride.vehicleId;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Route Card */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routePoints}>
              <View style={styles.dotGreen} />
              <View style={styles.routeLine} />
              <View style={styles.dotBlue} />
            </View>
            <View style={styles.routeNames}>
              <Text style={styles.cityText}>{ride.origin?.name}</Text>
              <Text style={styles.cityText}>{ride.destination?.name}</Text>
            </View>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>
              {format(new Date(ride.departureTime), 'EEEE, dd MMM yyyy • hh:mm a')}
            </Text>
          </View>
        </View>

        {/* Driver Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver</Text>
          <View style={styles.driverRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{driver?.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driver?.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>{driver?.rating || 'New'}</Text>
                {vehicle && <Text style={styles.vehicleText}>· {vehicle.model}</Text>}
              </View>
            </View>
            <TouchableOpacity style={styles.chatBtn}
              onPress={() => navigation.navigate('Chat', { bookingId: null, driverId: driver?._id, driverName: driver?.name })}>
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Info</Text>
          {[
            { icon: 'cash-outline', label: 'Price per seat', value: `₹${ride.pricePerSeat}` },
            { icon: 'people-outline', label: 'Available seats', value: ride.availableSeats },
            ...(ride.distance ? [{ icon: 'map-outline', label: 'Distance', value: `${(ride.distance / 1000).toFixed(0)} km` }] : []),
            ...(ride.duration ? [{ icon: 'time-outline', label: 'Duration', value: `${Math.round(ride.duration / 60)} mins` }] : []),
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Ionicons name={item.icon} size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Seat Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Seats</Text>
          <View style={styles.seatsRow}>
            {[1, 2, 3, 4].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.seatBtn, seats === n && styles.seatBtnActive, n > ride.availableSeats && styles.seatBtnDisabled]}
                onPress={() => n <= ride.availableSeats && setSeats(n)}
              >
                <Ionicons name="person" size={14} color={seats === n ? '#fff' : n > ride.availableSeats ? COLORS.border : COLORS.textSecondary} />
                <Text style={[styles.seatNum, seats === n && styles.seatNumActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{ride.pricePerSeat * seats}</Text>
        </View>
        <Button title="Book Now" onPress={handleBook} loading={loading} style={styles.bookBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card },
  cardTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  routePoints: { alignItems: 'center', gap: 2 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success },
  routeLine: { width: 2, height: 28, backgroundColor: COLORS.border },
  dotBlue: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  routeNames: { flex: 1, justifyContent: 'space-between', gap: 18 },
  cityText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: SIZES.sm, color: COLORS.textSecondary },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: SIZES.xl, fontWeight: '700' },
  driverName: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  vehicleText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '12', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  chatBtnText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.sm },
  infoValue: { color: COLORS.text, fontWeight: '600', fontSize: SIZES.sm },

  seatsRow: { flexDirection: 'row', gap: 10 },
  seatBtn: { flex: 1, height: 52, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', gap: 2 },
  seatBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  seatBtnDisabled: { opacity: 0.35 },
  seatNum: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textSecondary },
  seatNumActive: { color: '#fff' },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  totalAmount: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  bookBtn: { flex: 1, marginLeft: 16 },
});
