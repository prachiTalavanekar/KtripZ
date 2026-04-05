import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector(s => s.auth);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.hero}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.heroSub}>Where are you headed today?</Text>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('SearchRide')}>
          <Text style={styles.searchText}>🔍  Search rides...</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {[
            { icon: '🔍', label: 'Find Ride', screen: 'SearchRide' },
            { icon: '📋', label: 'My Bookings', screen: 'MyBookings' },
            { icon: '💬', label: 'Messages', screen: 'Notifications' },
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
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        {[
          { from: 'Mumbai', to: 'Pune', price: '₹350' },
          { from: 'Delhi', to: 'Agra', price: '₹450' },
          { from: 'Bangalore', to: 'Mysore', price: '₹280' },
        ].map((r, i) => (
          <TouchableOpacity key={i} style={styles.routeCard}
            onPress={() => navigation.navigate('SearchRide', { origin: r.from, destination: r.to })}>
            <View>
              <Text style={styles.routeText}>{r.from} → {r.to}</Text>
              <Text style={styles.routePrice}>From {r.price}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { padding: 24, paddingTop: 48, paddingBottom: 36 },
  greeting: { color: '#fff', fontSize: SIZES.xxl, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: SIZES.base, marginTop: 4, marginBottom: 20 },
  searchBar: {
    backgroundColor: '#fff', borderRadius: SIZES.radius, padding: 14,
    ...SHADOWS.card,
  },
  searchText: { color: COLORS.textSecondary, fontSize: SIZES.base },
  section: { padding: 20 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: {
    width: '23%', backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 12, alignItems: 'center', ...SHADOWS.card,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: SIZES.xs, color: COLORS.text, fontWeight: '500', textAlign: 'center' },
  routeCard: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, ...SHADOWS.card,
  },
  routeText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  routePrice: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: 24, color: COLORS.primary },
});

export default HomeScreen;
