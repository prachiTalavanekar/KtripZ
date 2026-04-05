import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { searchRides, setSelectedRide } from '../../store/slices/rideSlice';
import Input from '../../components/Input';
import Button from '../../components/Button';
import RideCard from '../../components/RideCard';
import Header from '../../components/Header';
import { COLORS, SIZES } from '../../constants/theme';

const SearchRideScreen = ({ navigation, route }) => {
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
    navigation.navigate('RideDetails', { rideId: ride._id });
  };

  return (
    <View style={styles.container}>
      <Header title="Find a Ride" />
      <View style={styles.form}>
        <Input label="From" value={form.origin} onChangeText={v => set('origin', v)} placeholder="e.g. Mumbai" />
        <Input label="To" value={form.destination} onChangeText={v => set('destination', v)} placeholder="e.g. Pune" />
        <View style={styles.row}>
          <Input label="Date" value={form.date} onChangeText={v => set('date', v)}
            placeholder="YYYY-MM-DD" style={styles.half} />
          <Input label="Seats" value={form.seats} onChangeText={v => set('seats', v)}
            keyboardType="numeric" style={styles.half} />
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
              <Text style={styles.empty}>No rides found. Try different dates or routes.</Text>
            }
          />
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { padding: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: SIZES.base },
});

export default SearchRideScreen;
