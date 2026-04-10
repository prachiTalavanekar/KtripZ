import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

const QUICK_ACTIONS = [
  { icon: 'search',        label: 'Find Ride',  screen: 'SearchRide' },
  { icon: 'receipt',       label: 'Bookings',   screen: 'MyBookings' },
  { icon: 'notifications', label: 'Alerts',     screen: 'Notifications' },
  { icon: 'person',        label: 'Profile',    screen: 'Profile' },
];

function Marquee({ routes, onPress }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const containerW = useRef(0);
  const contentW = useRef(0);
  const animRef = useRef(null);

  const startAnim = () => {
    if (!contentW.current || !containerW.current) return;
    if (animRef.current) { animRef.current.stop(); animRef.current = null; }

    // Start just off the right edge
    translateX.setValue(containerW.current);

    // Scroll left until content is fully off the left edge
    // Total travel = containerW + contentW (enter from right, exit to left)
    const totalTravel = containerW.current + contentW.current;
    const duration = totalTravel * 30; // ms per pixel — adjust for speed

    animRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: -contentW.current,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animRef.current.start();
  };

  useEffect(() => {
    startAnim();
    return () => animRef.current?.stop();
  }, [routes]);

  if (!routes.length) return null;

  return (
    <View
      style={mq.wrapper}
      onLayout={e => {
        containerW.current = e.nativeEvent.layout.width;
        startAnim();
      }}
    >
      <View style={mq.labelRow}>
        <Ionicons name="trending-up" size={12} color={COLORS.primary} />
        <Text style={mq.label}>YOUR ROUTES</Text>
      </View>
      <View style={mq.track}>
        <Animated.View
          style={{ flexDirection: 'row', transform: [{ translateX }] }}
          onLayout={e => {
            contentW.current = e.nativeEvent.layout.width;
            startAnim();
          }}
        >
          {/* Single copy — each route appears exactly once */}
          {routes.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={mq.chip}
              onPress={() => onPress(r.origin, r.destination)}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={11} color={COLORS.primary} />
              <Text style={mq.chipText}>{r.origin} → {r.destination}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const mq = StyleSheet.create({
  wrapper: { backgroundColor: COLORS.card, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.8 },
  track: { overflow: 'hidden' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0A1F4412', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10 },
  chipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
});

function UpcomingCard({ ride, onPress }) {
  return (
    <TouchableOpacity style={uc.card} onPress={onPress} activeOpacity={0.85}>
      <View style={uc.top}>
        <View style={uc.row}><View style={uc.dotG} /><Text style={uc.origin} numberOfLines={1}>{ride.origin?.name}</Text></View>
        <View style={uc.vline} />
        <View style={uc.row}><View style={uc.dotB} /><Text style={uc.dest} numberOfLines={1}>{ride.destination?.name}</Text></View>
      </View>
      <View style={uc.bottom}>
        <View style={uc.meta}><Ionicons name="calendar-outline" size={11} color={COLORS.textSecondary} /><Text style={uc.metaT}>{format(new Date(ride.departureTime), 'dd MMM')}</Text></View>
        <View style={uc.meta}><Ionicons name="time-outline" size={11} color={COLORS.textSecondary} /><Text style={uc.metaT}>{format(new Date(ride.departureTime), 'hh:mm a')}</Text></View>
        <View style={uc.meta}><Ionicons name="people-outline" size={11} color={COLORS.textSecondary} /><Text style={uc.metaT}>{ride.availableSeats}</Text></View>
        <Text style={uc.price}>Rs.{ride.pricePerSeat}</Text>
      </View>
    </TouchableOpacity>
  );
}

const uc = StyleSheet.create({
  card: { width: 200, backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginRight: 12, ...SHADOWS.card, borderTopWidth: 3, borderTopColor: COLORS.primary },
  top: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dotG: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  dotB: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  vline: { width: 1.5, height: 14, backgroundColor: COLORS.border, marginLeft: 3, marginVertical: 2 },
  origin: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text, flex: 1 },
  dest: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaT: { fontSize: 10, color: COLORS.textSecondary },
  price: { marginLeft: 'auto', fontSize: SIZES.base, fontWeight: '800', color: COLORS.primary },
});

export default function HomeScreen({ navigation }) {
  const { user } = useSelector(s => s.auth);
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [frequentRoutes, setFrequentRoutes] = useState([]);

  const loadData = async () => {
    setRidesLoading(true);
    try {
      const data = await api.get('/rides/upcoming?limit=5');
      setUpcomingRides(Array.isArray(data) ? data : []);
    } catch { setUpcomingRides([]); }
    setRidesLoading(false);
    try {
      const stored = await AsyncStorage.getItem(`freq_${user?._id}`);
      if (stored) setFrequentRoutes(JSON.parse(stored));
    } catch {}
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleSearch = async (from, to) => {
    if (!from || !to) return;
    try {
      const key = `freq_${user?._id}`;
      const stored = await AsyncStorage.getItem(key);
      const routes = stored ? JSON.parse(stored) : [];
      if (!routes.find(r => r.origin === from && r.destination === to)) {
        const updated = [{ origin: from, destination: to }, ...routes].slice(0, 8);
        await AsyncStorage.setItem(key, JSON.stringify(updated));
        setFrequentRoutes(updated);
      }
    } catch {}
    navigation.navigate('SearchRide', { origin: from, destination: to });
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={s.hero}>
          <Text style={s.greeting}>Hello, {user?.name?.split(' ')[0]} </Text>
          <Text style={s.heroSub}>Where are you headed today?</Text>
          <TouchableOpacity style={s.searchBar}
            onPress={() => navigation.navigate('SearchRide')} activeOpacity={0.85}>
            <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
            <Text style={s.searchText}>Search by source and destination...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Marquee — searched routes (above location) */}
        {frequentRoutes.length > 0 && (
          <Marquee routes={frequentRoutes} onPress={(f, t) => handleSearch(f, t)} />
        )}

        {/* Location — compact inline display */}
        {(user?.savedLocation?.city || user?.savedLocation?.village) ? (
          <View style={s.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={s.locationText} numberOfLines={1}>
              {[
                user.savedLocation.village,
                user.savedLocation.city,
                user.savedLocation.district,
                user.savedLocation.state,
              ].filter(Boolean).join(', ')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={s.locationAdd}
            onPress={() => navigation.getParent()?.navigate('Location')}
            activeOpacity={0.85}
          >
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={s.locationAddText}>Add your location</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        <View style={s.section}>
          <View style={s.actionsRow}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.label} style={s.actionCard}
                onPress={() => navigation.navigate(a.screen)} activeOpacity={0.8}>
                <View style={s.actionIcon}>
                  <Ionicons name={a.icon} size={22} color={COLORS.primary} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Upcoming Rides</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllRides')} style={s.seeAll}>
              <Text style={s.seeAllText}>See all</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {ridesLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : upcomingRides.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="car-outline" size={36} color={COLORS.border} />
              <Text style={s.emptyText}>No upcoming rides</Text>
            </View>
          ) : (
            <FlatList
              data={upcomingRides}
              keyExtractor={i => i._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4 }}
              renderItem={({ item }) => (
                <UpcomingCard ride={item}
                  onPress={() => navigation.getParent()?.navigate('RideDetails', { rideId: item._id })} />
              )}
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 32 },
  hero: { padding: 20, paddingBottom: 24 },
  greeting: { color: '#fff', fontSize: SIZES.xxl, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: SIZES.sm, marginTop: 2, marginBottom: 16 },
  searchBar: { backgroundColor: '#fff', borderRadius: SIZES.radius, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, ...SHADOWS.card },
  searchText: { color: COLORS.textSecondary, fontSize: SIZES.base, flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { width: '23%', backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 12, alignItems: 'center', ...SHADOWS.card },
  actionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0A1F4412', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 11, color: COLORS.text, fontWeight: '500', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, borderWidth: 1.5, borderColor: '#0A1F4430', ...SHADOWS.card },
  viewAllText: { flex: 1, fontSize: SIZES.base, color: COLORS.primary, fontWeight: '600' },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  locationText: { flex: 1, fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  locationAdd: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  locationAddText: { flex: 1, fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '500' },
});
