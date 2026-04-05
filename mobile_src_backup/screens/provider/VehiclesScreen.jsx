import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import api from '../../services/api';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric'];

const VehiclesScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ model: '', registrationNumber: '', seats: '', fuelType: 'petrol', color: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchVehicles = () => api.get('/vehicles').then(setVehicles).catch(console.error);
  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await api.post('/vehicles', { ...form, seats: Number(form.seats) });
      setShowModal(false);
      setForm({ model: '', registrationNumber: '', seats: '', fuelType: 'petrol', color: '' });
      fetchVehicles();
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Remove Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => api.delete(`/vehicles/${id}`).then(fetchVehicles) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="My Vehicles" right={
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Text style={styles.addBtn}>+ Add</Text>
        </TouchableOpacity>
      } />
      <FlatList data={vehicles} keyExtractor={i => i._id} contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.model}>{item.model}</Text>
              <Text style={styles.reg}>{item.registrationNumber}</Text>
              <Text style={styles.info}>{item.seats} seats · {item.fuelType} · {item.color}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id)}>
              <Text style={styles.deleteBtn}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No vehicles added yet</Text>}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Vehicle</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input label="Model" value={form.model} onChangeText={v => set('model', v)} placeholder="e.g. Honda City" />
              <Input label="Registration Number" value={form.registrationNumber} onChangeText={v => set('registrationNumber', v)} placeholder="MH01AB1234" />
              <Input label="Seats" value={form.seats} onChangeText={v => set('seats', v)} keyboardType="numeric" placeholder="4" />
              <Input label="Color" value={form.color} onChangeText={v => set('color', v)} placeholder="White" />
              <Text style={styles.fuelLabel}>Fuel Type</Text>
              <View style={styles.fuelRow}>
                {FUEL_TYPES.map(f => (
                  <TouchableOpacity key={f} style={[styles.fuelBtn, form.fuelType === f && styles.fuelBtnActive]}
                    onPress={() => set('fuelType', f)}>
                    <Text style={[styles.fuelBtnText, form.fuelType === f && styles.fuelBtnTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setShowModal(false)} style={styles.halfBtn} />
              <Button title="Add Vehicle" onPress={handleAdd} loading={loading} style={styles.halfBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  addBtn: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', ...SHADOWS.card },
  model: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  reg: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  info: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  deleteBtn: { fontSize: 20, padding: 4 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  fuelLabel: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text, marginBottom: 8 },
  fuelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  fuelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  fuelBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  fuelBtnText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  fuelBtnTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfBtn: { flex: 1 },
});

export default VehiclesScreen;
