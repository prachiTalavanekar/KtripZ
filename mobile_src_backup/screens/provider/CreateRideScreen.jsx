import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { createRide } from '../../store/slices/rideSlice';
import api from '../../services/api';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES } from '../../constants/theme';

const CreateRideScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    origin: '', destination: '', departureTime: '',
    pricePerSeat: '', totalSeats: '', vehicleId: '',
    description: '',
  });

  useEffect(() => {
    api.get('/vehicles').then(setVehicles).catch(console.error);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.origin || !form.destination || !form.departureTime || !form.pricePerSeat || !form.totalSeats || !form.vehicleId) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    setLoading(true);
    const payload = {
      origin: { name: form.origin },
      destination: { name: form.destination },
      departureTime: new Date(form.departureTime).toISOString(),
      pricePerSeat: Number(form.pricePerSeat),
      totalSeats: Number(form.totalSeats),
      availableSeats: Number(form.totalSeats),
      vehicleId: form.vehicleId,
      description: form.description,
    };
    const result = await dispatch(createRide(payload));
    setLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      Alert.alert('Success', 'Ride created successfully');
      navigation.goBack();
    } else {
      Alert.alert('Error', result.payload);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Create Ride" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="From *" value={form.origin} onChangeText={v => set('origin', v)} placeholder="e.g. Mumbai" />
        <Input label="To *" value={form.destination} onChangeText={v => set('destination', v)} placeholder="e.g. Pune" />
        <Input label="Departure Date & Time *" value={form.departureTime} onChangeText={v => set('departureTime', v)}
          placeholder="YYYY-MM-DDTHH:MM" />
        <View style={styles.row}>
          <Input label="Price/Seat (₹) *" value={form.pricePerSeat} onChangeText={v => set('pricePerSeat', v)}
            keyboardType="numeric" style={styles.half} />
          <Input label="Total Seats *" value={form.totalSeats} onChangeText={v => set('totalSeats', v)}
            keyboardType="numeric" style={styles.half} />
        </View>
        <Text style={styles.label}>Select Vehicle *</Text>
        {vehicles.length === 0
          ? <Text style={styles.noVehicle}>No vehicles added. Add a vehicle first.</Text>
          : vehicles.map(v => (
              <Button key={v._id} title={`${v.model} · ${v.registrationNumber}`}
                variant={form.vehicleId === v._id ? 'primary' : 'outline'}
                onPress={() => set('vehicleId', v._id)} style={styles.vehicleBtn} />
            ))
        }
        <Input label="Description (optional)" value={form.description} onChangeText={v => set('description', v)}
          placeholder="Any preferences or notes..." multiline style={{ marginTop: 8 }} />
        <Button title="Publish Ride" onPress={handleCreate} loading={loading} style={styles.submitBtn} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text, marginBottom: 8 },
  noVehicle: { color: COLORS.error, fontSize: SIZES.sm, marginBottom: 12 },
  vehicleBtn: { marginBottom: 8 },
  submitBtn: { marginTop: 16 },
});

export default CreateRideScreen;
