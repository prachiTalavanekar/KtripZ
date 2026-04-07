import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric'];
const FUEL_ICONS = { petrol: 'flame-outline', diesel: 'water-outline', cng: 'leaf-outline', electric: 'flash-outline' };

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ model: '', registrationNumber: '', seats: '', fuelType: 'petrol', color: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchVehicles = () => api.get('/vehicles').then(setVehicles).catch(console.error);
  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async () => {
    if (!form.model || !form.registrationNumber || !form.seats) {
      return Alert.alert('Missing Fields', 'Please fill model, registration and seats');
    }
    const totalSeats = Number(form.seats);
    if (totalSeats < 2) {
      return Alert.alert('Invalid Seats', 'Minimum 2 seats required (1 driver + 1 passenger)');
    }
    setLoading(true);
    try {
      await api.post('/vehicles', { ...form, seats: totalSeats });
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
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>My Vehicles</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={i => i._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="car-sport" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.model}>{item.model}</Text>
              <Text style={styles.reg}>{item.registrationNumber}</Text>
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Ionicons name="people-outline" size={11} color={COLORS.textSecondary} />
                  <Text style={styles.tagText}>{item.seats} seats total · {item.seats - 1} for passengers</Text>
                </View>
                <View style={styles.tag}>
                  <Ionicons name={FUEL_ICONS[item.fuelType] || 'flame-outline'} size={11} color={COLORS.textSecondary} />
                  <Text style={styles.tagText}>{item.fuelType}</Text>
                </View>
                {item.color ? (
                  <View style={styles.tag}>
                    <Ionicons name="color-palette-outline" size={11} color={COLORS.textSecondary} />
                    <Text style={styles.tagText}>{item.color}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={52} color={COLORS.border} />
            <Text style={styles.emptyText}>No vehicles added yet</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyAddText}>Add your first vehicle</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Vehicle Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vehicle</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Input label="Vehicle Model *" value={form.model} onChangeText={v => set('model', v)} placeholder="e.g. Honda City" />
              <Input label="Registration Number *" value={form.registrationNumber} onChangeText={v => set('registrationNumber', v)} placeholder="MH01AB1234" autoCapitalize="characters" />

              {/* Seats — total including driver */}
              <View style={styles.seatsSection}>
                <Input
                  label="Total Seats * (including driver seat)"
                  value={form.seats}
                  onChangeText={v => set('seats', v)}
                  keyboardType="numeric"
                  placeholder="e.g. 4"
                />
                {form.seats && Number(form.seats) >= 2 && (
                  <View style={styles.seatsBreakdown}>
                    <Ionicons name="information-circle-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.seatsBreakdownText}>
                      1 driver seat + {Number(form.seats) - 1} passenger seat(s)
                    </Text>
                  </View>
                )}
              </View>

              <Input label="Color" value={form.color} onChangeText={v => set('color', v)} placeholder="White" />

              <Text style={styles.fuelLabel}>Fuel Type</Text>
              <View style={styles.fuelRow}>
                {FUEL_TYPES.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.fuelBtn, form.fuelType === f && styles.fuelBtnActive]}
                    onPress={() => set('fuelType', f)}
                  >
                    <Ionicons name={FUEL_ICONS[f]} size={16} color={form.fuelType === f ? '#fff' : COLORS.textSecondary} />
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
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  pageTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
  list: { padding: 16, paddingTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOWS.card },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0A1F4412', alignItems: 'center', justifyContent: 'center' },
  model: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  reg: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  tagsRow: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F5F7FA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 11, color: COLORS.textSecondary },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E74C3C12', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textSecondary },
  emptyAddBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyAddText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text },
  seatsSection: { marginBottom: 4 },
  seatsBreakdown: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0A1F4410', padding: 10, borderRadius: 8, marginTop: -8, marginBottom: 12 },
  seatsBreakdownText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  fuelLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  fuelRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  fuelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  fuelBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  fuelBtnText: { fontSize: SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  fuelBtnTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  halfBtn: { flex: 1 },
});
