import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

const TABS = [
  { key: 'pending',  label: 'Pending',  icon: 'hourglass' },
  { key: 'approved', label: 'Approved', icon: 'checkmark-circle' },
  { key: 'rejected', label: 'Rejected', icon: 'close-circle' },
];

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ item, onApprove, onReject, onChat, onTrack }) {
  const ride = item.rideId;

  return (
    <View style={styles.card}>
      {/* Navy top accent */}
      <View style={styles.cardAccent} />

      <View style={styles.cardBody}>
        {/* Passenger row */}
        <View style={styles.passengerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.passengerId?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName}>{item.passengerId?.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.seatsBooked} seat(s)</Text>
              <View style={styles.dot} />
              <Ionicons name="cash-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>₹{item.totalAmount}</Text>
              {item.seatNumbers?.length > 0 && (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.metaText}>Seat {item.seatNumbers.join(', ')}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Ride info */}
        {ride && (
          <View style={styles.rideInfoRow}>
            <View style={styles.rideRouteLine}>
              <View style={styles.rideRoute}>
                <View style={styles.routeDotG} />
                <Text style={styles.rideRouteText} numberOfLines={1}>
                  {ride.origin?.name || 'Origin'}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={12} color={COLORS.textSecondary} />
              <View style={styles.rideRoute}>
                <View style={styles.routeDotB} />
                <Text style={styles.rideRouteText} numberOfLines={1}>
                  {ride.destination?.name || 'Destination'}
                </Text>
              </View>
            </View>
            {ride.departureTime && (
              <Text style={styles.rideDate}>
                {format(new Date(ride.departureTime), 'dd MMM yyyy, hh:mm a')}
              </Text>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Actions */}
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <Button title="Approve" onPress={onApprove} style={styles.approveBtn} />
            <Button title="Reject" variant="outline" onPress={onReject} style={styles.rejectBtn} />
          </View>
        )}

        {item.status === 'approved' && (
          <View style={styles.approvedActions}>
            <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.85}>
              <Ionicons name="chatbubble" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trackBtn} onPress={onTrack} activeOpacity={0.85}>
              <Ionicons name="navigate" size={14} color={COLORS.primary} />
              <Text style={styles.trackBtnText}>Start Tracking</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'rejected' && (
          <View style={styles.rejectedNote}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.rejectedNoteText}>This booking was rejected</Text>
          </View>
        )}

        {(item.status === 'ride_started' || item.status === 'completed') && (
          <View style={[styles.statusNote, { backgroundColor: item.status === 'completed' ? '#2ECC7115' : '#3498DB15' }]}>
            <Ionicons
              name={item.status === 'completed' ? 'checkmark-circle-outline' : 'navigate-outline'}
              size={14}
              color={item.status === 'completed' ? COLORS.success : COLORS.primary}
            />
            <Text style={[styles.statusNoteText, { color: item.status === 'completed' ? COLORS.success : COLORS.primary }]}>
              {item.status === 'completed' ? 'Ride Completed' : 'Ride in Progress'}
            </Text>
          </View>
        )}

        {item.status === 'cancelled' && (
          <View style={[styles.rejectedNote, { backgroundColor: '#EF444415' }]}>
            <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
            <Text style={[styles.rejectedNoteText, { color: '#EF4444' }]}>
              Cancelled by {item.cancelledBy || 'system'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ManageRideScreen({ route, navigation }) {
  const rideId = route.params?.rideId;
  const showAll = route.params?.showAll;

  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'pending');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = showAll || !rideId
        ? await api.get('/bookings/driver/pending')
        : await api.get(`/bookings/ride/${rideId}`);
      setAllBookings(Array.isArray(data) ? data : []);
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  }, [rideId, showAll]);

  useEffect(() => {
    fetchBookings();
    const socket = getSocket();
    socket?.on('booking_request', fetchBookings);
    return () => socket?.off('booking_request', fetchBookings);
  }, []);

  useFocusEffect(useCallback(() => { fetchBookings(); }, []));

  const handleAction = async (bookingId, action) => {
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      fetchBookings();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const filtered = allBookings.filter(b => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'approved') return ['approved', 'ride_started', 'completed'].includes(b.status);
    if (activeTab === 'rejected') return ['rejected', 'cancelled'].includes(b.status);
    return false;
  });

  const getCount = (tabKey) => allBookings.filter(b => {
    if (tabKey === 'pending') return b.status === 'pending';
    if (tabKey === 'approved') return ['approved', 'ride_started', 'completed'].includes(b.status);
    if (tabKey === 'rejected') return ['rejected', 'cancelled'].includes(b.status);
    return false;
  }).length;

  return (
    <View style={styles.root}>

      {/* ── Tab Bar — navy blue matching app theme ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const count = getCount(tab.key);
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
                color={active ? '#fff' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
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
              item={item}
              onApprove={() => handleAction(item._id, 'approve')}
              onReject={() => handleAction(item._id, 'reject')}
              onChat={() => navigation.navigate('Chat', {
                bookingId: item._id,
                driverId: item.passengerId?._id,
                driverName: item.passengerId?.name,
                bookingStatus: 'approved',
              })}
              onTrack={() => navigation.navigate('DriverTracking', {
                bookingId: item._id,
                passengerLat: item.rideId?.destination?.coordinates?.lat || null,
                passengerLng: item.rideId?.destination?.coordinates?.lng || null,
                passengerName: item.passengerId?.name,
                originName: item.rideId?.origin?.name,
                destinationName: item.rideId?.destination?.name,
              })}
            />
          )}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {filtered.length} {TABS.find(t => t.key === activeTab)?.label} request(s)
              </Text>
              <TouchableOpacity onPress={fetchBookings} style={styles.refreshBtn}>
                <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                No {TABS.find(t => t.key === activeTab)?.label} Requests
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'pending'
                  ? 'New booking requests will appear here'
                  : activeTab === 'approved'
                  ? 'Approved bookings will appear here'
                  : 'Rejected bookings will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // Tab bar — navy blue
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flex: 1, flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 3, paddingVertical: 8, borderRadius: SIZES.radius,
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tabLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  tabLabelActive: { color: '#fff', fontWeight: '700' },
  tabBadge: {
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: COLORS.accent },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 32 },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  listHeaderText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    marginBottom: 12, overflow: 'hidden', ...SHADOWS.card,
  },
  cardAccent: { height: 4, backgroundColor: COLORS.primary },
  cardBody: { padding: 14 },

  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: SIZES.base },
  passengerName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: COLORS.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.border },

  rideInfoRow: {
    backgroundColor: COLORS.background, borderRadius: 10,
    padding: 10, marginBottom: 12,
  },
  rideRouteLine: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  rideRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  routeDotG: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  routeDotB: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  rideRouteText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  rideDate: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4 },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },

  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, height: 42 },
  rejectBtn: { flex: 1, height: 42 },

  approvedActions: { flexDirection: 'row', gap: 8 },
  chatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
  trackBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingVertical: 10,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  trackBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm },

  rejectedNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.background, borderRadius: 8, padding: 8,
  },
  rejectedNoteText: { fontSize: 11, color: COLORS.textSecondary },

  statusNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, padding: 8,
  },
  statusNoteText: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#0A1F4410',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
