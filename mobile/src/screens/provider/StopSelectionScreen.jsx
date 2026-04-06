import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../context/RideContext';
import { getStops } from '../../services/mapsApi';
import StopCard from '../../components/StopCard';
import SearchBar from '../../components/SearchBar';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StopSelectionScreen({ route, navigation }) {
  const { type } = route.params; // 'FROM' or 'TO'
  const { rideDraft, updateDraft } = useRide();

  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const [stops, setStops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const debouncedCity = useDebounce(city, 300);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch stops when city input settles
  useEffect(() => {
    if (debouncedCity.trim().length < 2) {
      setStops([]);
      setFiltered([]);
      setFetched(false);
      return;
    }
    fetchStops(debouncedCity.trim());
  }, [debouncedCity]);

  // Filter stops when search query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFiltered(stops);
    } else {
      const q = debouncedQuery.toLowerCase();
      setFiltered(stops.filter(s => s.name.toLowerCase().includes(q)));
    }
  }, [debouncedQuery, stops]);

  const fetchStops = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStops(cityName);
      setStops(data);
      setFiltered(data);
      setFetched(true);
    } catch (e) {
      setError('Failed to fetch stops. Check your connection.');
    }
    setLoading(false);
  };

  const handleSelect = (stop) => {
    if (type === 'FROM') {
      updateDraft('fromStop', stop);
    } else {
      updateDraft('toStop', stop);
    }
    navigation.goBack();
  };

  const isFrom = type === 'FROM';
  const title = isFrom ? 'Select Pickup Stop' : 'Select Drop Stop';
  const cityPlaceholder = isFrom ? 'Enter origin city (e.g. Mumbai)' : 'Enter destination city (e.g. Pune)';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        {/* City Input */}
        <View style={styles.citySection}>
          <Text style={styles.label}>City</Text>
          <SearchBar
            value={city}
            onChangeText={setCity}
            onClear={() => { setCity(''); setStops([]); setFiltered([]); }}
            placeholder={cityPlaceholder}
          />
        </View>

        {/* Stop Search */}
        {stops.length > 0 && (
          <View style={styles.searchSection}>
            <Text style={styles.label}>Search Stop</Text>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              placeholder="Filter stops..."
            />
          </View>
        )}

        {/* Results */}
        {loading ? (
          <View style={styles.list}>
            <LoadingSkeleton count={6} />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="wifi-outline" size={40} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchStops(city)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : city.trim().length < 2 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="location-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Enter a city name</Text>
            <Text style={styles.emptySubtitle}>Type at least 2 characters to search stops</Text>
          </View>
        ) : fetched && filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No stops found</Text>
            <Text style={styles.emptySubtitle}>Try a different city name</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item, i) => `${item.name}-${i}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <StopCard stop={item} onPress={() => handleSelect(item)} />
            )}
            ListHeaderComponent={
              filtered.length > 0 ? (
                <Text style={styles.resultCount}>{filtered.length} stop(s) found</Text>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },
  body: { flex: 1, padding: 16 },
  citySection: { marginBottom: 12 },
  searchSection: { marginBottom: 12 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  list: { paddingBottom: 24 },
  resultCount: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 8 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.textSecondary },
  emptySubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  errorText: { fontSize: SIZES.base, color: COLORS.error, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
});
