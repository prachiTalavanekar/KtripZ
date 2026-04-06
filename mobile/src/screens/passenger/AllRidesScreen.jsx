import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { searchRides, setSelectedRide } from '../../store/slices/rideSlice';
import api from '../../services/api';
import Input from '../../components/Input';
import RideCard from '../../components/RideCard';
import { COLORS, SIZES } from '../../constants/theme';

export default function AllRidesScreen({ navigation }) {
  const dispatch = useDispatch();
  const { searchResults, loading } = useSelector(s => s.rides);
  const [allRides, setAllRides] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [searched, setSearched] = useState(false);

  // Load all upcoming rides on mount
  const loadAll = async () => {
    setAllLoading(true);
    try {
      const data = await api.get('/rides/upcoming?limit=50');
      setAllRides(Array.isArray(data) ? data : []);
    } catch { setAllRides([]); }
    setAllLoading(false);
  };

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const handleSearch = () => {
    if (!origin.trim() || !destination.trim()) return;
    dispatch(searchRides({ origin: origin.trim(), destination: destination.trim() }));
    setSearched(true);
  };

  const clearSearch = () => {
    setOrigin('');
    setDestination('');
    setSearched(false);
  };

  const handleSelect = (ride) => {
    dispatch(setSelectedRide(ride));
    navigation.getParent()?.navigate('RideDetails', { rideId: ride._id });
  };

  const displayData = searched ? searchResults : allRides;

  return (
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.searchBox}>
        <View style={styles.inputRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} style={styles.icon} />
          <Input placeholder="From" value={origin} onChangeText={setOrigin} style={styles.inputFlex} />
        </View>
        <View style={styles.inputRow}>
          <Ionicons name="navigate-outline" size={16} color="#F4A261" style={styles.icon} />
          <Input placeholder="To" value={destination} onChangeText={setDestination} style={styles.inputFlex} />
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
            <Ionicons name="search" size={16} color="#fff" />
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
          {searched && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearSearch} activeOpacity={0.85}>
              <Ionicons name="close" size={16} color={COLORS.textSecondary} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count */}
      {!allLoading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {searched ? `${searchResults.length} result(s)` : `${allRides.length} upcoming ride(s)`}
          </Text>
        </View>
      )}

      {/* List */}
      {(loading || allLoading) ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={i => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <RideCard ride={item} onPress={() => handleSelect(item)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>{searched ? 'No rides found' : 'No upcoming rides'}</Text>
              <Text style={styles.emptySub}>{searched ? 'Try different source or destination' : 'Check back later'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  searchBox: { backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  icon: { marginRight: 8, marginTop: 4 },
  inputFlex: { flex: 1, marginBottom: 0 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  searchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  clearBtnText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  countRow: { paddingHorizontal: 16, paddingVertical: 8 },
  countText: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  list: { padding: 16, paddingTop: 4 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.textSecondary },
  emptySub: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});
