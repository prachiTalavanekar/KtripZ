import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyRides } from '../../store/slices/rideSlice';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

const STATUS_COLORS = { scheduled: COLORS.success, active: '#3B82F6', completed: COLORS.textSecondary, cancelled: '#EF4444' };

export default function MyRidesScreen({ navigation }) {
  const dispatch = useDispatch();
  const { myRides, loading } = useSelector(s => s.rides);

  useEffect(() => { dispatch(fetchMyRides()); }, []);

  return (
    <View style={styles.root}>
      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        : <FlatList
            data={myRides}
            keyExtractor={i => i._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} activeOpacity={0.85}
                onPress={() => navigation.getParent()?.navigate('ManageRide', { rideId: item._id })}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="car" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.route} numberOfLines={1}>{item.origin?.name} → {item.destination?.name}</Text>
                    <Text style={styles.time}>{format(new Date(item.departureTime), 'dd MMM yyyy, hh:mm a')}</Text>
                    <Text style={styles.info}>₹{item.pricePerSeat}/seat · {item.availableSeats} seats left</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || COLORS.textSecondary }]} />
                  <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="car-outline" size={52} color={COLORS.border} />
                <Text style={styles.emptyText}>No rides yet</Text>
              </View>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', ...SHADOWS.card },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center' },
  route: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  time: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  info: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textSecondary },
});
