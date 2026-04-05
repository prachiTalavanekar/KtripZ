import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { searchRides, setSelectedRide } from '../../store/slices/rideSlice';
import Input from '../../components/Input';
import Button from '../../components/Button';
import RideCard from '../../components/RideCard';
import { COLORS, SIZES } from '../../constants/theme';

export default function SearchRideScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { searchResults, loading } = useSelector(s => s.rides);
  const [form, setForm] = useState({
    origin: route.params?.origin || '',
    destination: route.params?.destination || '',
    date: new Date().toISOString().split('T')[0],
    seats: '1',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSearch = () => dispatch(searchRides(form));

  const handleSelect = (ride) => {
    dispatch(setSelectedRide(ride));
    navigation.getParent()?.navigate('RideDetails', { rideId: ride._id });
  };

  return (
    <View style={styles.root}>
      <View style={styles.formBox}>
        <View style={styles.inputRow}>
          <Ionicons name="location-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
          <Input placeholder="From city" value={form.origin} onChangeText={v => set('origin', v)} style={styles.inputFlex} />
        </View>
        <View style={styles.inputRow}>
          <Ionicons name="navigate-outline" size={18} color={COLORS.accent} style={styles.inputIcon} />
          <Input placeholder="To city" value={form.destination} onChangeText={v => set('destination', v)} style={styles.inputFlex} />
        </View>
        <View style={styles.rowTwo}>
          <View style={[styles.inputRow, { flex: 1 }]}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
            <Input placeholder="YYYY-MM-DD" value={form.date} onChangeText={v => set('date', v)} style={styles.inputFlex} />
          </View>
          <View style={[styles.inputRow, { width: 90 }]}>
            <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
            <Input placeholder="1" value={form.seats} onChangeText={v => set('seats', v)} keyboardType="numeric" style={styles.inputFlex} />
          </View>
        </View>
        <Button title="Search Rides" onPress={handleSearch} loading={loading} />
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        : <FlatList
            data={searchResults}
            keyExtractor={i => i._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <RideCard ride={item} onPress={() => handleSelect(item)} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No rides found</Text>
                <Text style={styles.emptySubText}>Try different dates or routes</Text>
              </View>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  formBox: { backgroundColor: COLORS.card, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputIcon: { marginRight: 8, marginTop: 4 },
  inputFlex: { flex: 1, marginBottom: 0 },
  rowTwo: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  list: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.textSecondary },
  emptySubText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});
