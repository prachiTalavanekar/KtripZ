import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

function StatRow({ icon, label, value, color }) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AnalyticsScreen({ navigation }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/earnings')
      .then(data => { setEarnings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  const totalEarnings = earnings?.totalEarnings || 0;
  const totalRides = earnings?.totalRides || 0;
  const completedBookings = earnings?.completedBookings || 0;
  const avgPerRide = totalRides > 0 ? Math.round(totalEarnings / totalRides) : 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero earnings banner */}
        <View style={styles.earningsBanner}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsValue}>₹{totalEarnings.toLocaleString()}</Text>
          <Text style={styles.earningsSub}>Lifetime earnings from all rides</Text>
        </View>

        {/* Key Stats */}
        <SectionCard title="Performance Overview">
          <StatRow icon="car-outline" label="Total Rides Published" value={totalRides} color={COLORS.primary} />
          <View style={styles.divider} />
          <StatRow icon="people-outline" label="Passengers Served" value={completedBookings} color="#8B5CF6" />
          <View style={styles.divider} />
          <StatRow icon="cash-outline" label="Avg Earnings / Ride" value={`₹${avgPerRide}`} color={COLORS.success} />
          <View style={styles.divider} />
          <StatRow icon="trending-up-outline" label="Completion Rate" value={totalRides > 0 ? '100%' : '—'} color="#F59E0B" />
        </SectionCard>

        {/* Earnings Breakdown */}
        <SectionCard title="Earnings Breakdown">
          <View style={styles.breakdownRow}>
            <View style={[styles.breakdownCard, { borderLeftColor: COLORS.primary }]}>
              <Text style={styles.breakdownValue}>₹{totalEarnings.toLocaleString()}</Text>
              <Text style={styles.breakdownLabel}>Total</Text>
            </View>
            <View style={[styles.breakdownCard, { borderLeftColor: COLORS.success }]}>
              <Text style={styles.breakdownValue}>₹{avgPerRide}</Text>
              <Text style={styles.breakdownLabel}>Per Ride</Text>
            </View>
            <View style={[styles.breakdownCard, { borderLeftColor: '#8B5CF6' }]}>
              <Text style={styles.breakdownValue}>{completedBookings}</Text>
              <Text style={styles.breakdownLabel}>Bookings</Text>
            </View>
          </View>
        </SectionCard>

        {/* Tips */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Publish rides 2–3 days in advance to get more bookings and higher earnings.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32, gap: 14 },

  earningsBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    alignItems: 'center',
  },
  earningsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.sm, fontWeight: '500' },
  earningsValue: { color: '#fff', fontSize: 42, fontWeight: '800', marginVertical: 4 },
  earningsSub: { color: 'rgba(255,255,255,0.55)', fontSize: SIZES.xs },

  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 16,
    ...SHADOWS.card,
  },
  sectionTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 14 },

  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  statValue: { fontSize: SIZES.lg, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },

  breakdownRow: { flexDirection: 'row', gap: 10 },
  breakdownCard: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    padding: 12, borderLeftWidth: 3, alignItems: 'center',
  },
  breakdownValue: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  breakdownLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFFBEB', borderRadius: SIZES.radius,
    padding: 14, borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  tipText: { flex: 1, fontSize: SIZES.sm, color: '#92400E', lineHeight: 20 },
});
