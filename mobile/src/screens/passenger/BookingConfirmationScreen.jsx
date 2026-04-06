import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { createBooking } from '../../store/slices/bookingSlice';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

function Row({ label, value, bold, color }) {
  return (
    <View style={s.row}>
      <Text style={[s.label, bold && s.bold]}>{label}</Text>
      <Text style={[s.value, bold && s.bold, color && { color }]}>{value}</Text>
    </View>
  );
}

export default function BookingConfirmationScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { ride, selectedSeats, pricePerSeat, basePrice, gst, platformFee } = route.params;
  const [loading, setLoading] = useState(false);

  const seatsCount = selectedSeats.length;
  const totalBase = basePrice * seatsCount;
  const totalGst = gst * seatsCount;
  const totalPlatform = platformFee * seatsCount;
  const grandTotal = pricePerSeat * seatsCount;

  const driver = ride.driverId;
  const vehicle = ride.vehicleId;

  const handleBook = async () => {
    setLoading(true);
    const result = await dispatch(createBooking({
      rideId: ride._id,
      seatsBooked: seatsCount,
      seatNumbers: selectedSeats,
    }));
    setLoading(false);

    if (result.meta.requestStatus === 'fulfilled') {
      const remaining = result.payload?.availableSeats ?? '—';
      Alert.alert(
        'Booking Requested!',
        `Your booking request has been sent to the driver.\n\n${remaining} seat(s) still available on this ride.`,
        [{ text: 'View Bookings', onPress: () => navigation.navigate('Tabs', { screen: 'MyBookings' }) }]
      );
    } else {
      // Could be seat conflict — tell user to re-select
      const msg = result.payload || 'Something went wrong';
      Alert.alert('Booking Failed', msg, [
        { text: 'Re-select Seats', onPress: () => navigation.goBack() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Route */}
        <View style={s.routeCard}>
          <View style={s.routeRow}>
            <View style={s.dotG} />
            <Text style={s.routeCity}>{ride.origin?.name}</Text>
          </View>
          <View style={s.routeVline} />
          <View style={s.routeRow}>
            <View style={s.dotB} />
            <Text style={s.routeCity}>{ride.destination?.name}</Text>
          </View>
          <View style={s.routeDivider} />
          <View style={s.routeMeta}>
            <View style={s.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
              <Text style={s.metaText}>{format(new Date(ride.departureTime), 'dd MMM yyyy')}</Text>
            </View>
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
              <Text style={s.metaText}>{format(new Date(ride.departureTime), 'hh:mm a')}</Text>
            </View>
          </View>
        </View>

        {/* Seat & Vehicle */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Booking Details</Text>
          <Row label="Seats Selected" value={`Seat(s) ${selectedSeats.join(', ')}`} />
          <Row label="Number of Seats" value={seatsCount} />
          <Row label="Vehicle" value={vehicle?.model || '—'} />
          <Row label="Driver" value={driver?.name || '—'} />
        </View>

        {/* Price Breakdown */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Price Breakdown</Text>
          <Row label={`Base Price (₹${basePrice} × ${seatsCount})`} value={`₹${totalBase}`} />
          <View style={s.divider} />
          <Row label={`GST (${gst === Math.round(basePrice * 0.05) ? '5%' : '10%'} × ${seatsCount})`} value={`₹${totalGst}`} />
          <Row label={`Platform Fee (₹${platformFee} × ${seatsCount})`} value={`₹${totalPlatform}`} />
          <View style={s.totalDivider} />
          <Row label="Grand Total" value={`₹${grandTotal}`} bold color={COLORS.primary} />
        </View>

        {/* Payment note */}
        <View style={s.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={s.noteText}>
            Payment will be collected after driver approves your booking request.
          </Text>
        </View>

      </ScrollView>

      {/* Book Button */}
      <View style={s.footer}>
        <View>
          <Text style={s.footerLabel}>Grand Total</Text>
          <Text style={s.footerPrice}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity style={s.bookBtn} onPress={handleBook} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={s.bookBtnText}>Book Ride</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 100, gap: 14 },

  routeCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotG: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  dotB: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  routeVline: { width: 1.5, height: 16, backgroundColor: COLORS.border, marginLeft: 4, marginVertical: 3 },
  routeCity: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  routeDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  routeMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: SIZES.sm, color: COLORS.textSecondary },

  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card },
  cardTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  bold: { fontWeight: '800', fontSize: SIZES.base, color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  totalDivider: { height: 1.5, backgroundColor: COLORS.primary + '30', marginVertical: 6 },

  noteCard: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.primary + '08', borderRadius: SIZES.radius, padding: 14, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  noteText: { flex: 1, fontSize: SIZES.sm, color: COLORS.text, lineHeight: 20 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 10 },
  footerLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  footerPrice: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  bookBtn: { flex: 1, marginLeft: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, borderRadius: SIZES.radius, paddingVertical: 14 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
});
