import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ── Single Seat ───────────────────────────────────────────────────────────────
function Seat({ seat, isSelected, onPress }) {
  const { seatNumber, status } = seat;

  const cfg = {
    driver:    { bg: '#E5E7EB', border: '#D1D5DB', color: COLORS.textSecondary, icon: 'navigate-circle' },
    available: { bg: '#EEF4FF', border: COLORS.primary + '60', color: COLORS.primary, icon: 'person' },
    selected:  { bg: COLORS.primary, border: COLORS.primary, color: '#fff', icon: 'person' },
    booked:    { bg: '#F3F4F6', border: '#E5E7EB', color: '#D1D5DB', icon: 'person' },
  };

  const state = status === 'available' && isSelected ? 'selected' : status;
  const c = cfg[state] || cfg.booked;
  const disabled = status === 'driver' || status === 'booked';

  return (
    <TouchableOpacity
      style={[ss.box, { backgroundColor: c.bg, borderColor: c.border }]}
      onPress={() => !disabled && onPress(seat)}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Ionicons name={c.icon} size={18} color={c.color} />
      <Text style={[ss.num, { color: c.color }]}>{seatNumber}</Text>
    </TouchableOpacity>
  );
}

const ss = StyleSheet.create({
  box: { width: 58, height: 62, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2 },
  num: { fontSize: 12, fontWeight: '700' },
});

// ── Car Layout ────────────────────────────────────────────────────────────────
function CarLayout({ seats, selected, onPress }) {
  const driver = seats.find(s => s.status === 'driver');
  const passengers = seats.filter(s => s.status !== 'driver');

  // Rows of 4 (2 left + 2 right)
  const rows = [];
  for (let i = 0; i < passengers.length; i += 4) {
    rows.push(passengers.slice(i, i + 4));
  }

  return (
    <View style={cl.wrap}>
      {/* Front row */}
      <View style={cl.frontRow}>
        <View style={cl.steeringWrap}>
          <Ionicons name="navigate-circle" size={34} color={COLORS.primary} />
          <Text style={cl.steeringLabel}>Driver</Text>
        </View>
        <View style={cl.aisle} />
        {driver && <Seat seat={driver} isSelected={false} onPress={() => {}} />}
      </View>
      <View style={cl.separator} />
      {rows.map((row, ri) => (
        <View key={ri} style={cl.row}>
          <View style={cl.side}>
            {row.slice(0, 2).map(s => (
              <Seat key={s.seatNumber} seat={s}
                isSelected={selected.includes(s.seatNumber)}
                onPress={onPress} />
            ))}
            {row.slice(0, 2).length < 2 && <View style={ss.box} />}
          </View>
          <View style={cl.aisle} />
          <View style={cl.side}>
            {row.slice(2, 4).map(s => (
              <Seat key={s.seatNumber} seat={s}
                isSelected={selected.includes(s.seatNumber)}
                onPress={onPress} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const cl = StyleSheet.create({
  wrap: { paddingHorizontal: 8 },
  frontRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  steeringWrap: { alignItems: 'center', gap: 2 },
  steeringLabel: { fontSize: 10, color: COLORS.textSecondary },
  separator: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  side: { flex: 1, flexDirection: 'row', gap: 10, justifyContent: 'center' },
  aisle: { width: 28 },
});

// ── Bike Layout ───────────────────────────────────────────────────────────────
function BikeLayout({ seats, selected, onPress }) {
  return (
    <View style={bl.wrap}>
      {seats.map((s, i) => (
        <View key={s.seatNumber}>
          {i > 0 && <View style={bl.divider} />}
          <View style={bl.row}>
            <View style={bl.label}>
              <Ionicons
                name={s.status === 'driver' ? 'navigate-circle' : 'person'}
                size={28}
                color={s.status === 'driver' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={bl.labelText}>{s.status === 'driver' ? 'Driver' : 'Passenger'}</Text>
            </View>
            <Seat seat={s} isSelected={selected.includes(s.seatNumber)} onPress={onPress} />
          </View>
        </View>
      ))}
    </View>
  );
}

const bl = StyleSheet.create({
  wrap: { paddingHorizontal: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  label: { alignItems: 'center', gap: 4 },
  labelText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SeatSelectionScreen({ route, navigation }) {
  const { ride, pricePerSeat, basePrice, gst, platformFee } = route.params;
  const vehicle = ride.vehicleId;
  const isBike = vehicle?.seats <= 2;

  const [seats, setSeats] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  // Fetch real-time seat data from backend
  const fetchSeats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/bookings/seats/${ride._id}`);
      setSeats(data.seats || []);
      setAvailableCount(data.availableCount || 0);
      // Clear any selected seats that are now booked
      setSelected(prev => prev.filter(n => {
        const s = (data.seats || []).find(seat => seat.seatNumber === n);
        return s && s.status === 'available';
      }));
    } catch (e) {
      Alert.alert('Error', 'Failed to load seat data. Please try again.');
    }
    setLoading(false);
  }, [ride._id]);

  useEffect(() => {
    fetchSeats();

    // Listen for real-time ride updates via socket
    const socket = getSocket();
    const handleRideUpdate = (updatedRide) => {
      if (updatedRide._id === ride._id || updatedRide._id === ride._id?.toString()) {
        fetchSeats(); // Re-fetch seat map when ride is updated
      }
    };
    socket?.on('ride_updated', handleRideUpdate);
    return () => socket?.off('ride_updated', handleRideUpdate);
  }, [ride._id]);

  // Re-fetch when screen comes into focus (real-time sync)
  useFocusEffect(useCallback(() => { fetchSeats(); }, []));

  const handleSeatPress = (seat) => {
    if (seat.status !== 'available') return;
    if (isBike) {
      // 2-wheeler: only 1 passenger seat
      setSelected([seat.seatNumber]);
    } else {
      setSelected(prev =>
        prev.includes(seat.seatNumber)
          ? prev.filter(n => n !== seat.seatNumber)
          : [...prev, seat.seatNumber]
      );
    }
  };

  const handleConfirm = () => {
    if (selected.length === 0) {
      return Alert.alert('No seat selected', 'Please select at least one seat to continue');
    }
    navigation.navigate('BookingConfirmation', {
      ride, selectedSeats: selected, pricePerSeat, basePrice, gst, platformFee,
    });
  };

  const totalPrice = pricePerSeat * selected.length;

  return (
    <View style={styles.root}>
      {/* Legend */}
      <View style={styles.legend}>
        {[
          { bg: '#E5E7EB', label: 'Driver' },
          { bg: '#EEF4FF', label: 'Available' },
          { bg: COLORS.primary, label: 'Selected' },
          { bg: '#F3F4F6', label: 'Booked' },
        ].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.bg, borderWidth: 1, borderColor: '#E5E7EB' }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading real-time seat availability...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Vehicle info bar */}
          <View style={styles.vehicleBar}>
            <Ionicons name={isBike ? 'bicycle' : 'car-sport'} size={20} color={COLORS.primary} />
            <Text style={styles.vehicleName} numberOfLines={1}>
              {vehicle?.model} · {vehicle?.registrationNumber}
            </Text>
            <View style={[styles.badge, availableCount === 0 && styles.badgeFull]}>
              <Text style={[styles.badgeText, availableCount === 0 && styles.badgeTextFull]}>
                {availableCount === 0 ? 'Fully Booked' : `${availableCount} available`}
              </Text>
            </View>
          </View>

          {/* Seat layout */}
          <View style={styles.layoutCard}>
            <Text style={styles.layoutTitle}>
              {isBike ? '2-Wheeler Seating' : `${seats.length}-Seat Vehicle Layout`}
            </Text>
            {isBike
              ? <BikeLayout seats={seats} selected={selected} onPress={handleSeatPress} />
              : <CarLayout seats={seats} selected={selected} onPress={handleSeatPress} />
            }
          </View>

          {/* Refresh button */}
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchSeats}>
            <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
            <Text style={styles.refreshText}>Refresh availability</Text>
          </TouchableOpacity>

          {/* Selection summary */}
          {selected.length > 0 && (
            <View style={styles.summaryBanner}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.summaryText}>
                Seat(s) {selected.join(', ')} · ₹{totalPrice} total
              </Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>{selected.length} seat(s) selected</Text>
          <Text style={styles.footerPrice}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, selected.length === 0 && styles.confirmBtnOff]}
          onPress={handleConfirm}
          disabled={selected.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Seats</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  legend: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: COLORS.card, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  content: { padding: 16, paddingBottom: 110, gap: 12 },
  vehicleBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 12, ...SHADOWS.card,
  },
  vehicleName: { flex: 1, fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  badge: { backgroundColor: COLORS.primary + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeFull: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  badgeTextFull: { color: '#EF4444' },
  layoutCard: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 16, ...SHADOWS.card,
  },
  layoutTitle: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  refreshText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary + '10', borderRadius: SIZES.radius, padding: 12,
  },
  summaryText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, padding: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 10,
  },
  footerLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  footerPrice: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  confirmBtn: {
    flex: 1, marginLeft: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius, paddingVertical: 14,
  },
  confirmBtnOff: { backgroundColor: COLORS.border },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
});
