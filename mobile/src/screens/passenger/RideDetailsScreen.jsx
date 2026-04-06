import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking, Share, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const GST_4W = 0.10;
const GST_2W = 0.05;
const PLATFORM_FEE = 1;

function is2Wheeler(vehicle) {
  const model = (vehicle?.model || '').toLowerCase();
  return vehicle?.seats <= 2 || model.includes('bike') || model.includes('scooter') || model.includes('activa');
}

export default function RideDetailsScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/rides/${rideId}`)
      .then(data => { setRide(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [rideId]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  if (!ride) return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
      <Text style={{ color: COLORS.error, marginTop: 8 }}>Ride not found</Text>
    </View>
  );

  const driver = ride.driverId;
  const vehicle = ride.vehicleId;
  const twoW = is2Wheeler(vehicle);
  const gstRate = twoW ? GST_2W : GST_4W;
  const basePrice = ride.pricePerSeat;
  const gst = Math.round(basePrice * gstRate);
  const total = basePrice + gst + PLATFORM_FEE;

  const handleCall = () => {
    if (!driver?.phone) return Alert.alert('Not available', 'Driver phone not available');
    Linking.openURL(`tel:${driver.phone}`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🚗 KTripZ Ride\n${ride.origin?.name} → ${ride.destination?.name}\n📅 ${format(new Date(ride.departureTime), 'dd MMM yyyy, hh:mm a')}\n💺 ${ride.availableSeats} seats · ₹${ride.pricePerSeat}/seat\nBook now on KTripZ!`,
      });
    } catch {}
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Route Card ── */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeLeft}>
              <View style={styles.dotGreen} />
              <View style={styles.routeVLine} />
              <View style={styles.dotBlue} />
            </View>
            <View style={styles.routeRight}>
              <View style={styles.routeStop}>
                <Text style={styles.routeStopLabel}>FROM</Text>
                <Text style={styles.routeStopName}>{ride.origin?.name}</Text>
              </View>
              <View style={styles.routeStopGap} />
              <View style={styles.routeStop}>
                <Text style={styles.routeStopLabel}>TO</Text>
                <Text style={styles.routeStopName}>{ride.destination?.name}</Text>
              </View>
            </View>
            <View style={styles.routeMeta}>
              <View style={styles.routeMetaItem}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.routeMetaText}>{format(new Date(ride.departureTime), 'dd MMM yyyy')}</Text>
              </View>
              <View style={styles.routeMetaItem}>
                <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.routeMetaText}>{format(new Date(ride.departureTime), 'hh:mm a')}</Text>
              </View>
              <View style={styles.routeMetaItem}>
                <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.routeMetaText}>{ride.availableSeats} seats left</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Driver ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver</Text>
          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{driver?.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver?.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>{driver?.rating || 'New'}</Text>
              </View>
            </View>
            <View style={styles.driverBtns}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
                <Ionicons name="call" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}
                onPress={() => navigation.navigate('Chat', { bookingId: null, driverId: driver?._id, driverName: driver?.name })}>
                <Ionicons name="chatbubble" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Ionicons name="share-social" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Vehicle ── */}
        {vehicle && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vehicle</Text>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIcon}>
                <Ionicons name={twoW ? 'bicycle' : 'car-sport'} size={26} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                <View style={styles.vehicleTags}>
                  <View style={styles.tag}>
                    <Ionicons name="card-outline" size={11} color={COLORS.textSecondary} />
                    <Text style={styles.tagText}>{vehicle.registrationNumber}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Ionicons name="people-outline" size={11} color={COLORS.textSecondary} />
                    <Text style={styles.tagText}>{ride.availableSeats} seats available</Text>
                  </View>
                  {vehicle.color ? (
                    <View style={styles.tag}>
                      <Ionicons name="color-palette-outline" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.tagText}>{vehicle.color}</Text>
                    </View>
                  ) : null}
                  <View style={styles.tag}>
                    <Ionicons name="flame-outline" size={11} color={COLORS.textSecondary} />
                    <Text style={styles.tagText}>{vehicle.fuelType}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Price Breakdown ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Price</Text>
            <Text style={styles.priceValue}>₹{basePrice}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST ({twoW ? '5%' : '10%'} — {twoW ? '2-Wheeler' : '4-Wheeler'})</Text>
            <Text style={styles.priceValue}>₹{gst}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Fee</Text>
            <Text style={styles.priceValue}>₹{PLATFORM_FEE}</Text>
          </View>
          <View style={styles.priceTotalLine} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total per Seat</Text>
            <Text style={styles.priceTotalValue}>₹{total}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {ride.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Driver Notes</Text>
            <Text style={styles.notes}>{ride.description}</Text>
          </View>
        ) : null}

      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total per seat</Text>
          <Text style={styles.footerPrice}>₹{total}</Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaBtn, ride.availableSeats === 0 && styles.ctaBtnDisabled]}
          disabled={ride.availableSeats === 0}
          onPress={() => navigation.navigate('SeatSelection', {
            ride, pricePerSeat: total, basePrice, gst, platformFee: PLATFORM_FEE,
          })}
          activeOpacity={0.85}
        >
          <Ionicons name="car-sport" size={18} color="#fff" />
          <Text style={styles.ctaBtnText}>
            {ride.availableSeats === 0 ? 'Fully Booked' : 'Select Your Seat'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 100, gap: 12 },

  // Route card
  routeCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card },
  routeRow: { flexDirection: 'row', gap: 12 },
  routeLeft: { alignItems: 'center', paddingTop: 4 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' },
  routeVLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  dotBlue: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  routeRight: { flex: 1, justifyContent: 'space-between' },
  routeStop: {},
  routeStopGap: { height: 12 },
  routeStopLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  routeStopName: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  routeMeta: { gap: 6, justifyContent: 'center' },
  routeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeMetaText: { fontSize: 11, color: COLORS.textSecondary },

  // Cards
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card },
  cardTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },

  // Driver
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: SIZES.xl, fontWeight: '800' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  ratingText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  driverBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center' },

  // Vehicle
  vehicleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  vehicleIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center' },
  vehicleModel: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  vehicleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F5F7FA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, color: COLORS.textSecondary },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  priceLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  priceValue: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  priceDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  priceTotalLine: { height: 1.5, backgroundColor: COLORS.primary + '30', marginVertical: 6 },
  priceTotalLabel: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text },
  priceTotalValue: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.primary },

  notes: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, padding: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 10,
  },
  footerLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  footerPrice: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  ctaBtn: {
    flex: 1, marginLeft: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius, paddingVertical: 14,
  },
  ctaBtnDisabled: { backgroundColor: COLORS.textSecondary },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
});
