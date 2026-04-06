import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector as useReduxSelector } from 'react-redux';
import { searchRides, setSelectedRide } from '../../store/slices/rideSlice';
import Input from '../../components/Input';
import Button from '../../components/Button';
import RideCard from '../../components/RideCard';
import { COLORS, SIZES } from '../../constants/theme';

export default function SearchRideScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { searchResults, loading } = useSelector(s => s.rides);
  const { user } = useSelector(s => s.auth);
  const [searched, setSearched] = useState(false);

  const [origin, setOrigin] = useState(route.params?.origin || '');
  const [destination, setDestination] = useState(route.params?.destination || '');
  const [date, setDate] = useState('');       // optional
  const [seats, setSeats] = useState('');     // optional
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!origin.trim())      e.origin = 'Enter origin';
    if (!destination.trim()) e.destination = 'Enter destination';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSearch = async () => {
    if (!validate()) return;
    const params = { origin: origin.trim(), destination: destination.trim() };
    if (date.trim())  params.date = date.trim();
    if (seats.trim()) params.seats = seats.trim();
    dispatch(searchRides(params));
    setSearched(true);

    // Save to frequent routes
    try {
      const key = `freq_${user?._id}`;
      const stored = await AsyncStorage.getItem(key);
      const routes = stored ? JSON.parse(stored) : [];
      const from = origin.trim(), to = destination.trim();
      if (!routes.find(r => r.origin === from && r.destination === to)) {
        await AsyncStorage.setItem(key, JSON.stringify([{ origin: from, destination: to }, ...routes].slice(0, 8)));
      }
    } catch {}
  };

  const handleSelect = (ride) => {
    dispatch(setSelectedRide(ride));
    navigation.getParent()?.navigate('RideDetails', { rideId: ride._id });
  };

  return (
    <View style={styles.root}>
      {/* Search Form */}
      <View style={styles.form}>
        <View style={styles.routeRow}>
          <View style={styles.dots}>
            <View style={styles.dotG} />
            <View style={styles.dotLine} />
            <View style={styles.dotB} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Input
              placeholder="From — city or stop *"
              value={origin}
              onChangeText={v => { setOrigin(v); setErrors(e => ({ ...e, origin: null })); }}
              error={errors.origin}
              style={styles.inputFlat}
            />
            <Input
              placeholder="To — city or stop *"
              value={destination}
              onChangeText={v => { setDestination(v); setErrors(e => ({ ...e, destination: null })); }}
              error={errors.destination}
              style={styles.inputFlat}
            />
          </View>
        </View>

        {/* Optional filters */}
        <View style={styles.optRow}>
          <View style={styles.optField}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} style={styles.optIcon} />
            <Input
              placeholder="Date (optional)"
              value={date}
              onChangeText={setDate}
              keyboardType="numeric"
              style={styles.optInput}
            />
          </View>
          <View style={styles.optField}>
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} style={styles.optIcon} />
            <Input
              placeholder="Seats (optional)"
              value={seats}
              onChangeText={setSeats}
              keyboardType="numeric"
              style={styles.optInput}
            />
          </View>
        </View>

        <Button title="Search Rides" onPress={handleSearch} loading={loading} />
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={i => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <RideCard ride={item} onPress={() => handleSelect(item)} />}
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No rides found</Text>
                <Text style={styles.emptySub}>Try different source or destination</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="car-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Search for rides</Text>
                <Text style={styles.emptySub}>Enter source and destination above</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  form: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  routeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dots: { alignItems: 'center', paddingTop: 14 },
  dotG: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  dotLine: { width: 1.5, height: 28, backgroundColor: '#E5E7EB', marginVertical: 3 },
  dotB: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0A1F44' },
  inputFlat: { marginBottom: 4 },
  optRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  optField: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  optIcon: { marginRight: 4, marginTop: 4 },
  optInput: { flex: 1, marginBottom: 0 },
  list: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '600', color: '#6B7280' },
  emptySub: { fontSize: SIZES.sm, color: '#6B7280' },
});
