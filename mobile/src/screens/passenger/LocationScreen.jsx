import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { updateUser } from '../../store/slices/authSlice';
import Input from '../../components/Input';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ── Static data ───────────────────────────────────────────────────────────────
import districtsData from '../../../assets/maharashtra_districts.json';
import talukasData from '../../../assets/sindhudurg_talukas.json';
import villagesData from '../../../assets/sindh-villages.json';

const COUNTRY = 'India';
const STATE = 'Maharashtra';

// ── Picker Modal ──────────────────────────────────────────────────────────────
function PickerModal({ visible, title, items, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose} />
      <View style={pm.sheet}>
        <View style={pm.header}>
          <Text style={pm.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item, i) => `${item}-${i}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={pm.item} onPress={() => { onSelect(item); onClose(); }} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={pm.itemText}>{item}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.border} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={pm.sep} />}
        />
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  itemText: { flex: 1, fontSize: SIZES.base, color: COLORS.text },
  sep: { height: 1, backgroundColor: COLORS.border, marginLeft: 44 },
});

// ── Select Field ──────────────────────────────────────────────────────────────
function SelectField({ label, value, placeholder, onPress, disabled, icon }) {
  return (
    <View style={sf.wrap}>
      <Text style={sf.label}>{label}</Text>
      <TouchableOpacity
        style={[sf.field, disabled && sf.fieldDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons name={icon || 'chevron-down'} size={16} color={disabled ? COLORS.border : value ? COLORS.primary : COLORS.textSecondary} />
        <Text style={[sf.text, !value && sf.placeholder, disabled && sf.disabledText]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={disabled ? COLORS.border : COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const sf = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, backgroundColor: COLORS.inputBg, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14 },
  fieldDisabled: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  text: { flex: 1, fontSize: SIZES.base, color: COLORS.text },
  placeholder: { color: COLORS.textSecondary },
  disabledText: { color: COLORS.border },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LocationScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const existing = user?.savedLocation || {};

  const [district, setDistrict] = useState(existing.district || '');
  const [taluka, setTaluka] = useState(existing.city || '');
  const [village, setVillage] = useState(existing.village || '');
  const [street, setStreet] = useState(existing.street || '');
  const [pincode, setPincode] = useState(existing.pincode || '');
  const [lat, setLat] = useState(existing.lat || null);
  const [lng, setLng] = useState(existing.lng || null);

  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Picker state
  const [picker, setPicker] = useState({ visible: false, type: '' });

  // Derived lists
  const districts = districtsData.districts;

  const talukas = district === 'Sindhudurg'
    ? talukasData.talukas
    : district ? ['Select district first'] : [];

  const villages = district === 'Sindhudurg' && taluka
    ? (villagesData.talukas.find(t => t.name === taluka)?.villages || [])
    : [];

  // Reset downstream when parent changes
  const selectDistrict = (d) => { setDistrict(d); setTaluka(''); setVillage(''); };
  const selectTaluka = (t) => { setTaluka(t); setVillage(''); };

  const openPicker = (type) => setPicker({ visible: true, type });
  const closePicker = () => setPicker({ visible: false, type: '' });

  const getPickerItems = () => {
    if (picker.type === 'district') return districts;
    if (picker.type === 'taluka') return talukas;
    if (picker.type === 'village') return villages;
    return [];
  };

  const getPickerTitle = () => {
    if (picker.type === 'district') return 'Select District';
    if (picker.type === 'taluka') return `Select Taluka in ${district}`;
    if (picker.type === 'village') return `Select Village in ${taluka}`;
    return '';
  };

  const handlePickerSelect = (val) => {
    if (picker.type === 'district') selectDistrict(val);
    else if (picker.type === 'taluka') selectTaluka(val);
    else if (picker.type === 'village') setVillage(val);
  };

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        setDetecting(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);

      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (geo) {
        if (geo.subregion) selectDistrict(geo.subregion);
        if (geo.city) setTaluka(geo.city);
        if (geo.district) setVillage(geo.district);
        if (geo.street) setStreet(geo.street);
        if (geo.postalCode) setPincode(geo.postalCode);
      }
    } catch {
      Alert.alert('Error', 'Could not detect location. Please select manually.');
    }
    setDetecting(false);
  };

  const handleSave = async () => {
    if (!district) return Alert.alert('Required', 'Please select a district');
    setSaving(true);
    try {
      const payload = {
        country: COUNTRY,
        state: STATE,
        district,
        city: taluka,
        village,
        street,
        pincode,
        lat,
        lng,
      };
      const updatedUser = await api.put('/users/location', payload);
      dispatch(updateUser(updatedUser));
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Saved!', 'Your location has been saved', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const hasLocation = !!(existing.district || existing.city);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Current saved location */}
        {hasLocation && (
          <View style={styles.currentCard}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.currentLabel}>Current Saved Location</Text>
              <Text style={styles.currentValue}>
                {[existing.village, existing.city, existing.district, existing.state, existing.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Auto-detect */}
        <TouchableOpacity style={styles.detectBtn} onPress={detectLocation} disabled={detecting} activeOpacity={0.85}>
          {detecting ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="locate" size={18} color="#fff" />}
          <Text style={styles.detectBtnText}>{detecting ? 'Detecting...' : 'Auto-detect My Location'}</Text>
        </TouchableOpacity>

        <View style={styles.divRow}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>or select manually</Text>
          <View style={styles.divLine} />
        </View>

        {/* Fixed fields */}
        <View style={styles.fixedRow}>
          <View style={styles.fixedField}>
            <Ionicons name="globe-outline" size={14} color={COLORS.primary} />
            <Text style={styles.fixedText}>India</Text>
          </View>
          <View style={styles.fixedField}>
            <Ionicons name="map-outline" size={14} color={COLORS.primary} />
            <Text style={styles.fixedText}>Maharashtra</Text>
          </View>
        </View>

        {/* District picker */}
        <SelectField
          label="District *"
          value={district}
          placeholder="Select district"
          icon="business-outline"
          onPress={() => openPicker('district')}
        />

        {/* Taluka picker */}
        <SelectField
          label={district === 'Sindhudurg' ? 'Taluka' : 'Taluka (only Sindhudurg supported)'}
          value={taluka}
          placeholder={district ? (district === 'Sindhudurg' ? 'Select taluka' : 'Not available for this district') : 'Select district first'}
          icon="location-outline"
          onPress={() => district === 'Sindhudurg' && openPicker('taluka')}
          disabled={!district || district !== 'Sindhudurg'}
        />

        {/* Village picker */}
        <SelectField
          label="Village / Area"
          value={village}
          placeholder={taluka ? 'Select village' : 'Select taluka first'}
          icon="home-outline"
          onPress={() => taluka && villages.length > 0 && openPicker('village')}
          disabled={!taluka || villages.length === 0}
        />

        {/* Street */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Street Address (optional)</Text>
          <Input value={street} onChangeText={setStreet} placeholder="e.g. Near Bus Stand" />
        </View>

        {/* Pincode */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>PIN Code (optional)</Text>
          <Input value={pincode} onChangeText={setPincode} placeholder="e.g. 416520" keyboardType="numeric" />
        </View>

        {/* GPS coords */}
        {lat && lng && (
          <View style={styles.gpsRow}>
            <Ionicons name="pin" size={13} color={COLORS.success} />
            <Text style={styles.gpsText}>GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</Text>
          </View>
        )}

        {/* Summary */}
        {district && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Selected Location</Text>
            <Text style={styles.summaryValue}>
              {[village, taluka, district, STATE, COUNTRY].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle" size={20} color="#fff" />}
          <Text style={styles.saveBtnText}>Save Location</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Picker Modal */}
      <PickerModal
        visible={picker.visible}
        title={getPickerTitle()}
        items={getPickerItems()}
        onSelect={handlePickerSelect}
        onClose={closePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },

  currentCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: COLORS.primary, ...SHADOWS.card },
  currentLabel: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  currentValue: { fontSize: SIZES.sm, color: COLORS.text, lineHeight: 18 },

  detectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14, marginBottom: 16 },
  detectBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },

  divRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  divText: { fontSize: SIZES.xs, color: COLORS.textSecondary },

  fixedRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  fixedField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary + '08', borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.primary + '20' },
  fixedText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.primary },

  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 },

  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.success + '12', borderRadius: 8, padding: 10, marginBottom: 14 },
  gpsText: { fontSize: SIZES.xs, color: COLORS.success, fontWeight: '600' },

  summaryCard: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, padding: 14, marginBottom: 16 },
  summaryLabel: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: SIZES.sm, color: '#fff', fontWeight: '600', lineHeight: 20 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
});
