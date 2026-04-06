import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  ActivityIndicator, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useRide } from '../../context/RideContext';
import { createRide } from '../../store/slices/rideSlice';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ── Touchable stop field ──────────────────────────────────────────────────────
function StopField({ label, value, placeholder, onPress, icon, error }) {
  return (
    <View style={sf.wrapper}>
      <Text style={sf.label}>{label}</Text>
      <TouchableOpacity style={[sf.field, error && sf.fieldError]} onPress={onPress} activeOpacity={0.75}>
        <Ionicons name={icon} size={16} color={value ? COLORS.primary : COLORS.textSecondary} />
        <Text style={[sf.text, !value && sf.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.border} />
      </TouchableOpacity>
      {error && <Text style={sf.error}>{error}</Text>}
    </View>
  );
}

const sf = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 50, backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  fieldError: { borderColor: COLORS.error },
  text: { flex: 1, fontSize: SIZES.base, color: COLORS.text },
  placeholder: { color: COLORS.textSecondary },
  error: { fontSize: SIZES.xs, color: COLORS.error, marginTop: 4 },
});

// ── Touchable date/time picker field ─────────────────────────────────────────
function PickerField({ label, value, placeholder, onPress, icon, error }) {
  return (
    <View style={pf.wrapper}>
      <Text style={pf.label}>{label}</Text>
      <TouchableOpacity style={[pf.field, error && pf.fieldError]} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name={icon} size={16} color={value ? COLORS.primary : COLORS.textSecondary} />
        <Text style={[pf.text, !value && pf.placeholder]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={pf.error}>{error}</Text>}
    </View>
  );
}

const pf = StyleSheet.create({
  wrapper: { flex: 1 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 50, backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  fieldError: { borderColor: COLORS.error },
  text: { flex: 1, fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  placeholder: { color: COLORS.textSecondary, fontWeight: '400' },
  error: { fontSize: SIZES.xs, color: COLORS.error, marginTop: 4 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CreateRideScreen({ navigation }) {
  const dispatch = useDispatch();
  const { rideDraft, updateDraft, resetDraft } = useRide();

  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [errors, setErrors] = useState({});

  // Date/time as a single Date object
  const [departureDate, setDepartureDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [price, setPrice] = useState('');
  const [seats, setSeats] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  // Formatted display
  const dateDisplay = departureDate
    ? departureDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const timeDisplay = departureDate
    ? departureDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  const onDateChange = (event, selected) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    const base = departureDate || new Date();
    const merged = new Date(selected);
    merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
    setDepartureDate(merged);
    setErrors(e => ({ ...e, date: null }));
    // On Android auto-open time picker after date
    if (Platform.OS === 'android') setTimeout(() => setShowTimePicker(true), 300);
  };

  const onTimeChange = (event, selected) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    const base = departureDate || new Date();
    const merged = new Date(base);
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDepartureDate(merged);
    setErrors(e => ({ ...e, time: null }));
  };

  const fetchVehicles = () => {
    setVehiclesLoading(true);
    api.get('/vehicles')
      .then(data => { setVehicles(Array.isArray(data) ? data : []); setVehiclesLoading(false); })
      .catch(() => setVehiclesLoading(false));
  };

  useEffect(() => { fetchVehicles(); }, []);

  useFocusEffect(useCallback(() => {}, [rideDraft]));

  const selectVehicle = (v) => {
    setSelectedVehicle(v);
    setVehicleId(v._id);
    // Max passenger seats = totalSeats - 1 (driver)
    const maxPassenger = v.seats - 1;
    if (seats && Number(seats) > maxPassenger) setSeats(String(maxPassenger));
    setErrors(e => ({ ...e, vehicleId: null }));
  };

  const validate = () => {
    const e = {};
    if (!rideDraft.fromStop)  e.fromStop = 'Select a pickup stop';
    if (!rideDraft.toStop)    e.toStop = 'Select a drop stop';
    if (!departureDate)       e.date = 'Select departure date';
    if (!departureDate)       e.time = 'Select departure time';
    if (!price)               e.price = 'Price required';
    if (!seats)               e.seats = 'Seats required';
    if (!vehicleId)           e.vehicleId = 'Select a vehicle';
    if (selectedVehicle && seats) {
      const n = Number(seats);
      const maxPassenger = selectedVehicle.seats - 1;
      if (n < 1) e.seats = 'Min 1 seat';
      else if (n > maxPassenger) e.seats = `Max ${maxPassenger} passenger seats (${selectedVehicle.seats} total − 1 driver)`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    if (departureDate <= new Date()) return Alert.alert('Invalid Time', 'Departure must be in the future');

    setLoading(true);
    const result = await dispatch(createRide({
      origin: { name: rideDraft.fromStop.name, coordinates: { lat: rideDraft.fromStop.lat, lng: rideDraft.fromStop.lng } },
      destination: { name: rideDraft.toStop.name, coordinates: { lat: rideDraft.toStop.lat, lng: rideDraft.toStop.lng } },
      departureTime: departureDate.toISOString(),
      pricePerSeat: Number(price),
      totalSeats: Number(seats),
      availableSeats: Number(seats),
      vehicleId,
      description,
    }));
    setLoading(false);

    if (result.meta.requestStatus === 'fulfilled') {
      resetDraft();
      setDepartureDate(null); setPrice(''); setSeats(''); setDescription(''); setVehicleId(''); setSelectedVehicle(null);
      Alert.alert('Success', 'Ride published!', [
        { text: 'OK', onPress: () => navigation.getParent()?.navigate('MyRides') },
      ]);
    } else {
      Alert.alert('Error', result.payload || 'Failed to create ride');
    }
  };

  const minDate = new Date();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Route */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <StopField
            label="From (Pickup Stop) *"
            value={rideDraft.fromStop?.name}
            placeholder="Tap to select pickup stop"
            icon="location"
            error={errors.fromStop}
            onPress={() => navigation.navigate('StopSelection', { type: 'FROM' })}
          />
          <StopField
            label="To (Drop Stop) *"
            value={rideDraft.toStop?.name}
            placeholder="Tap to select drop stop"
            icon="navigate"
            error={errors.toStop}
            onPress={() => navigation.navigate('StopSelection', { type: 'TO' })}
          />
        </View>

        {/* Departure — calendar + clock pickers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Departure</Text>
          <View style={styles.row}>
            <PickerField
              label="Date *"
              value={dateDisplay}
              placeholder="Select date"
              icon="calendar-outline"
              error={errors.date}
              onPress={() => setShowDatePicker(true)}
            />
            <View style={{ width: 12 }} />
            <PickerField
              label="Time *"
              value={timeDisplay}
              placeholder="Select time"
              icon="time-outline"
              error={errors.time}
              onPress={() => {
                if (!departureDate) {
                  Alert.alert('Select date first', 'Please pick a date before selecting time');
                  return;
                }
                setShowTimePicker(true);
              }}
            />
          </View>

          {departureDate && (
            <View style={styles.departureSummary}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.departureSummaryText}>
                {departureDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                {' at '}
                {departureDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </Text>
            </View>
          )}
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={departureDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={minDate}
            onChange={onDateChange}
            themeVariant="light"
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={departureDate || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            is24Hour={false}
          />
        )}

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing & Seats</Text>
          <View style={styles.row}>
            <Input label="Price/Seat (₹) *" value={price}
              onChangeText={v => { setPrice(v); setErrors(e => ({ ...e, price: null })); }}
              keyboardType="numeric" placeholder="500" error={errors.price} style={styles.flex1} />
            <View style={styles.flex1}>
              <Input
                label={selectedVehicle
                  ? `Available Seats * (max ${selectedVehicle.seats - 1})`
                  : 'Available Seats *'}
                value={seats}
                onChangeText={v => { setSeats(v); setErrors(e => ({ ...e, seats: null })); }}
                keyboardType="numeric"
                placeholder={selectedVehicle ? `1–${selectedVehicle.seats - 1}` : 'Select vehicle first'}
                error={errors.seats}
                editable={!!selectedVehicle}
              />
              {selectedVehicle && (
                <View style={styles.seatsInfo}>
                  <Ionicons name="information-circle-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.seatsInfoText}>
                    {selectedVehicle.seats} total seats − 1 driver = {selectedVehicle.seats - 1} passenger seats
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Vehicle *</Text>
          {errors.vehicleId && <Text style={styles.errorText}>{errors.vehicleId}</Text>}
          {vehiclesLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : vehicles.length === 0 ? (
            <View style={styles.noVehicleBox}>
              <Ionicons name="car-outline" size={32} color="#92400E" />
              <Text style={styles.noVehicleText}>No vehicles found</Text>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Vehicles')}>
                <Text style={styles.addVehicleLink}>+ Add a vehicle first</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={fetchVehicles}><Text style={styles.retryLink}>Retry</Text></TouchableOpacity>
            </View>
          ) : (
            vehicles.map(v => {
              const sel = vehicleId === v._id;
              return (
                <TouchableOpacity key={v._id}
                  style={[styles.vehicleCard, sel && styles.vehicleCardActive]}
                  onPress={() => selectVehicle(v)} activeOpacity={0.8}>
                  <View style={[styles.vehicleIcon, sel && styles.vehicleIconActive]}>
                    <Ionicons name="car-sport" size={20} color={sel ? '#fff' : COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleModel, sel && styles.vehicleModelActive]}>{v.model}</Text>
                    <Text style={[styles.vehicleReg, sel && styles.vehicleRegActive]}>
                      {v.registrationNumber} · {v.seats} seats · {v.fuelType}
                    </Text>
                  </View>
                  {sel && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Input label="Description (optional)" value={description} onChangeText={setDescription}
            placeholder="Any preferences or notes..." multiline />
        </View>

        <Button title="Publish Ride" onPress={handleCreate} loading={loading}
          style={styles.submitBtn} disabled={vehicles.length === 0} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  departureSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: COLORS.success + '12',
    padding: 10, borderRadius: 8,
  },
  departureSummaryText: { fontSize: SIZES.sm, color: COLORS.success, fontWeight: '600' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  hintText: { fontSize: SIZES.xs, color: COLORS.primary },
  seatsInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: -4, marginBottom: 4 },
  seatsInfoText: { flex: 1, fontSize: SIZES.xs, color: COLORS.primary, lineHeight: 16 },
  errorText: { fontSize: SIZES.xs, color: COLORS.error, marginBottom: 8 },
  noVehicleBox: {
    backgroundColor: '#FEF3C7', borderRadius: 10,
    padding: 16, alignItems: 'center', gap: 8,
  },
  noVehicleText: { color: '#92400E', fontSize: SIZES.sm, fontWeight: '600' },
  addVehicleLink: { color: COLORS.primary, fontSize: SIZES.base, fontWeight: '700' },
  retryLink: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, marginBottom: 8, backgroundColor: '#fff',
  },
  vehicleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  vehicleIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleIconActive: { backgroundColor: COLORS.primary },
  vehicleModel: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  vehicleModelActive: { color: COLORS.primary },
  vehicleReg: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  vehicleRegActive: { color: COLORS.primary },
  submitBtn: { marginTop: 4 },
});
