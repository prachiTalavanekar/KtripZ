import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const QUICK_ACTIONS = [
  { icon: 'search', label: 'Find Ride', screen: 'SearchRide' },
  { icon: 'receipt', label: 'Bookings', screen: 'MyBookings' },
  { icon: 'notifications', label: 'Alerts', screen: 'Notifications' },
  { icon: 'person', label: 'Profile', screen: 'Profile' },
];

const POPULAR_ROUTES = [
  { from: 'Mumbai', to: 'Pune', price: '₹350' },
  { from: 'Delhi', to: 'Agra', price: '₹450' },
  { from: 'Bangalore', to: 'Mysore', price: '₹280' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useSelector(s => s.auth);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.hero}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.heroSub}>Where are you headed today?</Text>
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('SearchRide')} activeOpacity={0.85}>
            <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.searchText}>Search rides...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.screen)} activeOpacity={0.8}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name={a.icon} size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          {POPULAR_ROUTES.map((r, i) => (
            <TouchableOpacity key={i} style={styles.routeCard} activeOpacity={0.85}
              onPress={() => navigation.navigate('SearchRide', { origin: r.from, destination: r.to })}>
              <View style={styles.routeLeft}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={styles.routeText}>{r.from} → {r.to}</Text>
              </View>
              <View style={styles.routeRight}>
                <Text style={styles.routePrice}>From {r.price}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 24 },
  hero: { padding: 20, paddingBottom: 28 },
  greeting: { color: '#fff', fontSize: SIZES.xxl, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: SIZES.sm, marginTop: 2, marginBottom: 16 },
  searchBar: {
    backgroundColor: '#fff', borderRadius: SIZES.radius, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, ...SHADOWS.card,
  },
  searchText: { color: COLORS.textSecondary, fontSize: SIZES.base, flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: {
    width: '23%', backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 12, alignItems: 'center', ...SHADOWS.card,
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  actionLabel: { fontSize: 11, color: COLORS.text, fontWeight: '500', textAlign: 'center' },
  routeCard: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, ...SHADOWS.card,
  },
  routeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  routeText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  routeRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routePrice: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});
