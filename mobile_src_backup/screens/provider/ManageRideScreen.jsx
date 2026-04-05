import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const ManageRideScreen = ({ route, navigation }) => {
  const { rideId } = route.params;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    api.get(`/bookings/ride/${rideId}`).then(data => { setBookings(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleAction = async (bookingId, action) => {
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      fetchBookings();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.passengerRow}>
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarLetter}>{item.passengerId?.name?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.passengerName}>{item.passengerId?.name}</Text>
          <Text style={styles.seats}>{item.seatsBooked} seat(s) · ₹{item.totalAmount}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.status === 'pending' ? '#FEF3C7' : item.status === 'approved' ? '#D1FAE5' : '#FEE2E2' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <Button title="Approve" onPress={() => handleAction(item._id, 'approve')} style={styles.approveBtn} />
          <Button title="Reject" variant="outline" onPress={() => handleAction(item._id, 'reject')} style={styles.rejectBtn} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Manage Bookings" />
      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        : <FlatList data={bookings} keyExtractor={i => i._id} contentContainerStyle={styles.list}
            renderItem={renderBooking}
            ListEmptyComponent={<Text style={styles.empty}>No booking requests yet</Text>} />
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 12, ...SHADOWS.card },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
  passengerName: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  seats: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.text },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveBtn: { flex: 1, height: 40 },
  rejectBtn: { flex: 1, height: 40 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60 },
});

export default ManageRideScreen;
