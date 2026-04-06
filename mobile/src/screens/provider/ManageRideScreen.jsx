import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const STATUS_CONFIG = {
  pending:   { color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  approved:  { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  rejected:  { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6', icon: 'ban-outline' },
};

export default function ManageRideScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [bookings, setBookings] = useState([]);
  const [rideInfo, setRideInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/bookings/ride/${rideId}`),
      api.get(`/rides/${rideId}`),
    ]).then(([bData, rData]) => {
      setBookings(bData);
      setRideInfo(rData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [rideId]);

  useEffect(() => {
    fetchBookings();
    // Listen for real-time booking requests and ride updates
    const socket = getSocket();
    socket?.on('booking_request', fetchBookings);
    socket?.on('ride_updated', (r) => {
      if (r._id === rideId) setRideInfo(r);
    });
    return () => {
      socket?.off('booking_request', fetchBookings);
      socket?.off('ride_updated');
    };
  }, [rideId]);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [rideId]));

  const handleAction = async (bookingId, action) => {
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      fetchBookings();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const renderBooking = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.passengerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{item.passengerId?.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerName}>{item.passengerId?.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.seatsBooked} seat(s)</Text>
                <Ionicons name="cash-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>₹{item.totalAmount}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[styles.badgeText, { color: cfg.color }]}>{item.status}</Text>
            </View>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <Button title="Approve" onPress={() => handleAction(item._id, 'approve')} style={styles.approveBtn} />
            <Button title="Reject" variant="outline" onPress={() => handleAction(item._id, 'reject')} style={styles.rejectBtn} />
          </View>
        )}
        {item.status === 'approved' && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('Chat', {
              bookingId: item._id,
              driverId: item.passengerId?._id,
              driverName: item.passengerId?.name,
              bookingStatus: 'approved',
            })}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble" size={14} color="#fff" />
            <Text style={styles.chatBtnText}>Chat with {item.passengerId?.name?.split(' ')[0]}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Booking Requests</Text>
        <TouchableOpacity onPress={fetchBookings} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        : <FlatList
            data={bookings}
            keyExtractor={i => i._id}
            contentContainerStyle={styles.list}
            renderItem={renderBooking}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={52} color={COLORS.border} />
                <Text style={styles.emptyText}>No booking requests yet</Text>
              </View>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  pageTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 12, ...SHADOWS.card },
  cardHeader: { marginBottom: 4 },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
  passengerName: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveBtn: { flex: 1, height: 42 },
  rejectBtn: { flex: 1, height: 42 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingVertical: 10, marginTop: 10,
  },
  chatBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { color: COLORS.textSecondary, fontSize: SIZES.base },
});
