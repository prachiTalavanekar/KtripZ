import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { createBooking } from '../../store/slices/bookingSlice';
import api from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

const RideDetailsScreen = ({ route, navigation }) => {
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

  if (!ride) return <View style={styles.center}><Text>Loading...</Text></View>;

  const driver = ride.driverId;
  const vehicle = ride.vehicleId;

  return (
    <View style={styles.container}>
      <Header title="Ride Details" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <View style={styles.dot} />
              <Text style={styles.cityText}>{ride.origin?.name}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.dot, styles.dotDest]} />
              <Text style={styles.cityText}>{ride.destination?.name}</Text>
            </View>
          </View>
          <Text style={styles.time}>{format(new Date(ride.departureTime), 'EEEE, dd MMM yyyy • hh:mm a')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.driverRow}>
            {driver?.profileImage
              ? <Image source={{ uri: driver.profileImage }} style={styles.avatar} />
              : <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{driver?.name?.[0]}</Text></View>
            }
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driver?.name}</Text>
              <Text style={styles.rating}>⭐ {driver?.rating || 'New'} · {vehicle?.model}</Text>
            </View>
            <TouchableOpacity style={styles.chatBtn}
              onPress={() => navigation.navigate('Chat', { bookingId: null, driverId: driver?._id, driverName: driver?.name })}>
              <Text style={styles.chatBtnText}>💬 Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price per seat</Text>
            <Text style={styles.infoValue}>₹{ride.pricePerSeat}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Available seats</Text>
            <Text style={styles.infoValue}>{ride.availableSeats}</Text>
          </View>
          {ride.distance && <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{(ride.distance / 1000).toFixed(0)} km</Text>
          </View>}
          {ride.duration && <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{Math.round(ride.duration / 60)} mins</Text>
          </View>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Seats</Text>
          <View style={styles.seatsRow}>
            {[1, 2, 3, 4].map(n => (
              <TouchableOpacity key={n} style={[styles.seatBtn, seats === n && styles.seatBtnActive]}
                onPress={() => setSeats(n)} disabled={n > ride.availableSeats}>
                <Text style={[styles.seatBtnText, seats === n && styles.seatBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{ride.pricePerSeat * seats}</Text>
        </View>
        <Button title="Book Now" onPress={handleBook} loading={loading} style={styles.bookBtn} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card },
  routeRow: { gap: 8 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  dotDest: { backgroundColor: COLORS.accent },
  routeLine: { width: 2, height: 20, backgroundColor: COLORS.border, marginLeft: 5 },
  cityText: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text },
  time: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 10 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: SIZES.xl, fontWeight: '700' },
  driverName: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  rating: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  chatBtn: { backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chatBtnText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  cardTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  infoValue: { color: COLORS.text, fontWeight: '600', fontSize: SIZES.sm },
  seatsRow: { flexDirection: 'row', gap: 12 },
  seatBtn: { width: 48, height: 48, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  seatBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  seatBtnText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  seatBtnTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  totalAmount: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  bookBtn: { flex: 1, marginLeft: 16 },
});

export default RideDetailsScreen;
