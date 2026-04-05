import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { createRide } from '../../store/slices/rideSlice';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export default function CreateRideScreen({ navigation }) {
  const dispatch = useDispatch();
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    origin: '', destination: '', departureTime: '',
    pricePerSeat: '', totalSeats: '', vehicleId: '',
    description: '',
  });

  const fetchVehicles = () => {
    setVehiclesLoading(true);
    api.get('/vehicles')
      .then(data => {
        setVehicles(Array.isArray(data) ? data : []);
        setVehiclesLoading(false);
      })
      .catch(err => {
        console.error('Vehicles fetch error:', err.message);
        setVehiclesLoading(false);
      });
  };

  useEffect(() => { fetchVehicles(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.origin || !form.destination || !form.departureTime || !form.pricePerSeat || !form.totalSeats) {
      return Alert.alert('Missing Fields', 'Please fill all required fields');
    }
    if (!form.vehicleId) {
      return Alert.alert('No Vehicle', 'Please select a vehicle');
    }
    const parsedDate = new Date(form.departureTime);
    if (isNaN(parsedDate.getTime())) {
      return Alert.alert('Invalid Date', 'Use format: YYYY-MM-DDTHH:MM (e.g. 2025-12-25T10:30)');
    }
    setLoading(true);
    const payload = {
      origin: { name: form.origin },
      destination: { name: form.destination },
      departureTime: parsedDate.toISOString(),
      pricePerSeat: Number(form.pricePerSeat),
      totalSeats: Number(form.totalSeats),
      availableSeats: Number(form.totalSeats),
      vehicleId: form.vehicleId,
      description: form.description,
    };
    const result = await dispatch(createRide(payload));
    setLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      Alert.alert('Success', 'Ride published successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.payload || 'Failed to create ride');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Input label="From *" value={form.origin} onChangeText={v => set('origin', v)} placeholder="e.g. Mumbai" />
        <Input label="To *" value={form.destination} onChangeText={v => set('destination', v)} placeholder="e.g. Pune" />
        <Input
          label="Departure Date & Time *"
          value={form.departureTime}
          onChangeText={v => set('departureTime', v)}
          placeholder="2025-12-25T10:30"
        />
        <View style={styles.row}>
          <Input label="Price/Seat (₹) *" value={form.pricePerSeat} onChangeText={v => set('pricePerSeat', v)}
            keyboardType="numeric" style={styles.half} placeholder="500" />
          <Input label="Total Seats *" value={form.totalSeats} onChangeText={v => set('totalSeats', v)}
            keyboardType="numeric" style={styles.half} placeholder="3" />
        </View>

        <Text style={styles.sectionLabel}>Select Vehicle *</Text>

        {vehiclesLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
        ) : vehicles.length === 0 ? (
          <View style={styles.noVehicleBox}>
            <Text style={styles.noVehicleText}>No vehicles found.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Vehicles')}>
              <Text style={styles.addVehicleLink}>+ Add a vehicle first</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchVehicles} style={{ marginTop: 6 }}>
              <Text style={styles.retryLink}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map(v => (
            <TouchableOpacity
              key={v._id}
              style={[styles.vehicleCard, form.vehicleId === v._id && styles.vehicleCardActive]}
              onPress={() => set('vehicleId', v._id)}
              activeOpacity={0.8}
            >
              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleModel, form.vehicleId === v._id && styles.vehicleModelActive]}>
                  {v.model}
                </Text>
                <Text style={[styles.vehicleReg, form.vehicleId === v._id && styles.vehicleRegActive]}>
                  {v.registrationNumber} · {v.seats} seats · {v.fuelType}
                </Text>
              </View>
              {form.vehicleId === v._id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))
        )}

        <Input
          label="Description (optional)"
          value={form.description}
          onChangeText={v => set('description', v)}
          placeholder="Any preferences or notes..."
          multiline
          style={{ marginTop: 8 }}
        />

        <Button
          title="Publish Ride"
          onPress={handleCreate}
          loading={loading}
          style={styles.submitBtn}
          disabled={vehicles.length === 0}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  sectionLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 10, marginTop: 4 },
  noVehicleBox: {
    backgroundColor: '#FEF3C7', borderRadius: SIZES.radius,
    padding: 16, marginBottom: 12, alignItems: 'center',
  },
  noVehicleText: { color: '#92400E', fontSize: SIZES.sm, fontWeight: '500' },
  addVehicleLink: { color: COLORS.primary, fontSize: SIZES.base, fontWeight: '700', marginTop: 8 },
  retryLink: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 4 },
  vehicleCard: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: SIZES.radius,
    padding: 14, marginBottom: 10, flexDirection: 'row',
    alignItems: 'center', backgroundColor: COLORS.card, ...SHADOWS.card,
  },
  vehicleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  vehicleInfo: { flex: 1 },
  vehicleModel: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  vehicleModelActive: { color: COLORS.primary },
  vehicleReg: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  vehicleRegActive: { color: COLORS.primary },
  checkmark: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  submitBtn: { marginTop: 20 },
});
