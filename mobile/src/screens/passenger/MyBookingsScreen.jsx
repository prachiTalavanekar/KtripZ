import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyBookings } from '../../store/slices/bookingSlice';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'upcoming',  label: 'Upcoming',  icon: 'time' },
  { key: 'pending',   label: 'Pending',   icon: 'hourglass' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
];

function filterByTab(bookings, tab) {
  const now = new Date();
  switch (tab) {
    case 'upcoming':
      return bookings.filter(b =>
        b.status === 'approved' &&
        b.rideId?.departureTime &&
        new Date(b.rideId.departureTime) > now
      );
    case 'pending':
      return bookings.filter(b => b.status === 'pending');
    case 'completed':
      return bookings.filter(b =>
        b.status === 'completed' ||
        (b.status === 'approved' && b.rideId?.departureTime && new Date(b.rideId.departureTime) <= now)
      );
    case 'cancelled':
      return bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected');
    default:
      return bookings;
  }
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, tab, onChatPress, onCancelPress }) {
  const ride = booking.rideId;
  // Chat only available when approved
  const chatEnabled = booking.status === 'approved';
  const isPast = ride?.departureTime && new Date(ride.departureTime) <= new Date();
  const canCancel = booking.status === 'pending' || (booking.status === 'approved' && !isPast);

  // Status label
  const statusLabel = {
    pending: 'Awaiting Approval',
    approved: isPast ? 'Completed' : 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }[booking.status] || booking.status;

  return (
    <View style={styles.card}>
      {/* Navy top accent bar */}
      <View style={styles.cardAccent} />

      <View style={styles.cardInner}>
        {/* Route */}
        <View style={styles.routeSection}>
          <View style={styles.routeTrack}>
            <View style={styles.dotOrigin} />
            <View style={styles.trackLine} />
            <View style={styles.dotDest} />
          </View>
          <View style={styles.routeLabels}>
            <Text style={styles.cityName} numberOfLines={1}>{ride?.origin?.name || '—'}</Text>
            <Text style={styles.cityName} numberOfLines={1}>{ride?.destination?.name || '—'}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
            <Text style={styles.infoText}>
              {ride?.departureTime ? format(new Date(ride.departureTime), 'dd MMM yyyy') : '—'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={13} color={COLORS.primary} />
            <Text style={styles.infoText}>
              {ride?.departureTime ? format(new Date(ride.departureTime), 'hh:mm a') : '—'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={13} color={COLORS.primary} />
            <Text style={styles.infoText}>{booking.seatsBooked} seat(s)</Text>
          </View>
        </View>

        {/* Seat numbers */}
        {booking.seatNumbers?.length > 0 && (
          <View style={styles.seatRow}>
            <Ionicons name="car-sport-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.seatText}>Seat(s): {booking.seatNumbers.join(', ')}</Text>
          </View>
        )}

        {/* Amount + Actions */}
        <View style={styles.footer}>
          <View style={styles.amountWrap}>
            <Text style={styles.amountLabel}>Total Paid</Text>
            <Text style={styles.amountValue}>₹{booking.totalAmount}</Text>
          </View>
          <View style={styles.actions}>
            {chatEnabled ? (
              <TouchableOpacity style={styles.chatBtn} onPress={onChatPress} activeOpacity={0.8}>
                <Ionicons name="chatbubble" size={14} color="#fff" />
                <Text style={styles.chatBtnText}>Chat Driver</Text>
              </TouchableOpacity>
            ) : booking.status === 'pending' ? (
              <View style={styles.chatBtnLocked}>
                <Ionicons name="lock-closed-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.chatBtnLockedText}>Chat unlocks on approval</Text>
              </View>
            ) : null}
            {canCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancelPress} activeOpacity={0.8}>
                <Ionicons name="close-outline" size={14} color={COLORS.error} />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MyBookingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.bookings);
  const [activeTab, setActiveTab] = useState('upcoming');

  const load = () => dispatch(fetchMyBookings());
  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = filterByTab(list, activeTab);

  const handleCancel = (booking) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/bookings/${booking._id}/cancel`);
            load();
          } catch (e) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const count = filterByTab(list, tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={active ? tab.icon : `${tab.icon}-outline`}
                size={16}
                color={active ? '#fff' : 'rgba(255,255,255,0.55)'}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              tab={activeTab}
              onChatPress={() => navigation.getParent()?.navigate('Chat', {
                bookingId: item._id,
                driverId: item.rideId?.driverId?._id || item.rideId?.driverId,
                driverName: item.rideId?.driverId?.name,
                bookingStatus: item.status,
              })}
              onCancelPress={() => handleCancel(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                No {TABS.find(t => t.key === activeTab)?.label} Bookings
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'upcoming'
                  ? 'Your confirmed upcoming rides will appear here'
                  : activeTab === 'pending'
                  ? 'Bookings waiting for driver approval'
                  : activeTab === 'completed'
                  ? 'Your past rides will appear here'
                  : 'Cancelled or rejected bookings'}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.findRideBtn}
                  onPress={() => navigation.navigate('SearchRide')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="search" size={14} color="#fff" />
                  <Text style={styles.findRideBtnText}>Find a Ride</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // Tab bar — navy blue background
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 3, paddingVertical: 8, borderRadius: SIZES.radius,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '500', textAlign: 'center',
  },
  tabLabelActive: {
    color: '#fff', fontWeight: '700',
  },
  tabCount: {
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabCountActive: {
    backgroundColor: COLORS.accent,
  },
  tabCountText: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  tabCountTextActive: { color: '#fff' },

  list: { padding: 16, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardAccent: {
    height: 4,
    backgroundColor: COLORS.primary,
  },
  cardInner: { padding: 14 },

  // Route
  routeSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  routeTrack: { alignItems: 'center' },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  trackLine: { width: 1.5, height: 18, backgroundColor: COLORS.border, marginVertical: 3 },
  dotDest: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  routeLabels: { flex: 1, justifyContent: 'space-between', gap: 14 },
  cityName: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text },
  statusPill: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },

  // Info
  infoRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: COLORS.textSecondary },

  seatRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  seatText: { fontSize: 11, color: COLORS.textSecondary },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  amountWrap: {},
  amountLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  amountValue: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 8 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  chatBtnText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  chatBtnLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  chatBtnLockedText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.error + '12', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.error + '30',
  },
  cancelBtnText: { fontSize: 11, color: COLORS.error, fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  findRideBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    marginTop: 4,
  },
  findRideBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
});
