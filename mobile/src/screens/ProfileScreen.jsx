import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/slices/authSlice';
import { disconnectSocket } from '../services/socket';
import api from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', { name, phone });
      Alert.alert('Success', 'Profile updated');
      setEditing(false);
    } catch (e) { Alert.alert('Error', e.message); }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: () => {
          disconnectSocket();
          dispatch(logout());
          // Navigate to root Login screen
          const rootNav = navigation.getParent('RootStack') || navigation.getParent() || navigation;
          rootNav.navigate('Login');
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{user?.rating || '—'}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          {editing ? (
            <>
              <Input label="Name" value={name} onChangeText={setName} />
              <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <View style={styles.btnRow}>
                <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={styles.halfBtn} />
                <Button title="Save" onPress={handleSave} loading={saving} style={styles.halfBtn} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone}</Text>
              </View>
              {user?.savedLocation?.city || user?.savedLocation?.village ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {[user.savedLocation.village, user.savedLocation.city, user.savedLocation.state].filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Manage Location */}
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={() => navigation.getParent()?.navigate('Location')}
          activeOpacity={0.85}
        >
          <View style={styles.locationBtnLeft}>
            <View style={styles.locationBtnIcon}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.locationBtnTitle}>Manage Location</Text>
              <Text style={styles.locationBtnSub}>
                {user?.savedLocation?.city || user?.savedLocation?.village
                  ? [user.savedLocation.village, user.savedLocation.city].filter(Boolean).join(', ')
                  : 'No location saved'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, elevation: 4,
  },
  avatarLetter: { color: '#fff', fontSize: 38, fontWeight: '800' },
  name: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.text },
  roleBadge: { backgroundColor: '#0A1F4415', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  roleText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rating: { fontSize: SIZES.base, color: COLORS.text, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, width: 50 },
  infoValue: { flex: 1, fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingTop: 12 },
  editBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfBtn: { flex: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14,
    borderWidth: 1, borderColor: '#E74C3C40', ...SHADOWS.card,
  },
  logoutText: { fontSize: SIZES.base, color: COLORS.error, fontWeight: '600' },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14,
    marginBottom: 12, ...SHADOWS.card,
  },
  locationBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationBtnIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0A1F4412', alignItems: 'center', justifyContent: 'center' },
  locationBtnTitle: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  locationBtnSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
});
