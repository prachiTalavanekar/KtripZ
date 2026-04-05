import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyRides } from '../../store/slices/rideSlice';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Ride Row ─────────────────────────────────────────────────────────────────
function RideRow({ ride, onPress }) {
  const isUpcoming = ride.status === 'scheduled';
  return (
    <TouchableOpacity style={styles.rideRow} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.rideStatusBar, { backgroundColor: isUpcoming ? COLORS.primary : COLORS.success }]} />
      <View style={styles.rideContent}>
        <View style={styles.rideTop}>
          <Text style={styles.rideRoute} numberOfLines={1}>
            {ride.origin?.name} → {ride.destination?.name}
          </Text>
          <View style={[styles.rideBadge, { backgroundColor: isUpcoming ? COLORS.primary + '15' : COLORS.success + '15' }]}>
            <Text style={[styles.rideBadgeText, { color: isUpcoming ? COLORS.primary : COLORS.success }]}>
              {isUpcoming ? 'Upcoming' : ride.status}
            </Text>
          </View>
        </View>
        <View style={styles.rideMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {format(new Date(ride.departureTime), 'dd MMM, hh:mm a')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{ride.availableSeats} seats left</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>₹{ride.pricePerSeat}/seat</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProviderDashboard({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { myRides, loading } = useSelector(s => s.rides);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    dispatch(fetchMyRides());
    api.get('/users/earnings').then(setEarnings).catch(console.error);
  }, []);

  const upcomingRides = myRides.filter(r => r.status === 'scheduled').slice(0, 5);
  const recentRides = myRides.filter(r => r.status !== 'scheduled').slice(0, 3);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetSub}>Welcome back,</Text>
            <Text style={styles.greetName}>{user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.analyticsBtn}
            onPress={() => navigation.getParent()?.navigate('Analytics')}
          >
            <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
            <Text style={styles.analyticsBtnText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <StatCard
            icon="people-outline"
            label="Passengers"
            value={earnings?.completedBookings ?? '—'}
          />
          <StatCard
            icon="car-outline"
            label="Total Trips"
            value={earnings?.totalRides ?? '—'}
          />
          <StatCard
            icon="star-outline"
            label="Rating"
            value={user?.rating ? Number(user.rating).toFixed(1) : '—'}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => navigation.navigate('CreateRide')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.primaryActionText}>Publish New Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('Vehicles')}
            activeOpacity={0.85}
          >
            <Ionicons name="car-sport-outline" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryActionText}>Vehicles</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Rides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Rides</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyRides')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : upcomingRides.length > 0 ? (
            upcomingRides.map(ride => (
              <RideRow
                key={ride._id}
                ride={ride}
                onPress={() => navigation.getParent()?.navigate('ManageRide', { rideId: ride._id })}
              />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.border} />
              <Text style={styles.emptyText}>No upcoming rides</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateRide')}>
                <Text style={styles.emptyAction}>Publish your first ride →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Rides */}
        {recentRides.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Rides</Text>
            </View>
            {recentRides.map(ride => (
              <RideRow
                key={ride._id}
                ride={ride}
                onPress={() => navigation.getParent()?.navigate('ManageRide', { rideId: ride._id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 32 },

  greeting: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  greetSub: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  greetName: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  analyticsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  analyticsBtnText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, marginBottom: 14,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 14, alignItems: 'center', ...SHADOWS.card,
    borderTopWidth: 3, borderTopColor: COLORS.primary,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 6 },
  primaryAction: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingVertical: 14,
  },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
  secondaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.primary + '40',
  },
  secondaryActionText: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  // Ride Row
  rideRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    marginBottom: 10, overflow: 'hidden', ...SHADOWS.card,
  },
  rideStatusBar: { width: 4, alignSelf: 'stretch' },
  rideContent: { flex: 1, padding: 12 },
  rideTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rideRoute: { flex: 1, fontSize: SIZES.base, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  rideBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  rideBadgeText: { fontSize: 10, fontWeight: '700' },
  rideMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: COLORS.textSecondary },

  // Empty
  emptyBox: {
    alignItems: 'center', paddingVertical: 28,
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    gap: 8, ...SHADOWS.card,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  emptyAction: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm },
});
