import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyRides } from '../../store/slices/rideSlice';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import Header from '../../components/Header';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const ProviderDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { myRides } = useSelector(s => s.rides);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    dispatch(fetchMyRides());
    api.get('/users/earnings').then(setEarnings).catch(console.error);
  }, []);

  const activeRides = myRides.filter(r => r.status === 'scheduled').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.hero}>
        <Text style={styles.greeting}>Welcome, {user?.name?.split(' ')[0]}</Text>
        <Text style={styles.heroSub}>Driver Dashboard</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{earnings?.totalEarnings || 0}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{earnings?.totalRides || 0}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeRides}</Text>
            <Text style={styles.statLabel}>Active Rides</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: '➕', label: 'Create Ride', screen: 'CreateRide' },
            { icon: '🚗', label: 'My Rides', screen: 'MyRides' },
            { icon: '🚙', label: 'Vehicles', screen: 'Vehicles' },
            { icon: '👤', label: 'Profile', screen: 'Profile' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.screen)}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyRides')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {myRides.slice(0, 3).map(ride => (
          <TouchableOpacity key={ride._id} style={styles.rideRow}
            onPress={() => navigation.navigate('ManageRide', { rideId: ride._id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rideRoute}>{ride.origin?.name} → {ride.destination?.name}</Text>
              <Text style={styles.rideInfo}>₹{ride.pricePerSeat}/seat · {ride.availableSeats} seats left</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: ride.status === 'scheduled' ? COLORS.success : COLORS.textSecondary }]} />
          </TouchableOpacity>
        ))}
        {myRides.length === 0 && <Text style={styles.empty}>No rides yet. Create your first ride!</Text>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { padding: 24, paddingTop: 48, paddingBottom: 28 },
  greeting: { color: '#fff', fontSize: SIZES.xxl, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.sm, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: SIZES.radius, padding: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: SIZES.xl, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.xs, marginTop: 2, textAlign: 'center' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  seeAll: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, alignItems: 'center', ...SHADOWS.card },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '600' },
  rideRow: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', ...SHADOWS.card },
  rideRoute: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  rideInfo: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
});

export default ProviderDashboard;
