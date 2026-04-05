import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const ProfileScreen = () => {
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
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" showBack={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          {user?.profileImage
            ? <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            : <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{user?.name?.[0]}</Text>
              </View>
          }
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {user?.rating || '—'}</Text>
          </View>
        </View>

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
              <View style={styles.infoRow}><Text style={styles.label}>Email</Text><Text style={styles.value}>{user?.email}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{user?.phone}</Text></View>
              <Button title="Edit Profile" variant="outline" onPress={() => setEditing(true)} style={{ marginTop: 8 }} />
            </>
          )}
        </View>

        <Button title="Logout" onPress={handleLogout} style={styles.logoutBtn}
          textStyle={{ color: COLORS.error }}
          variant="outline" />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLetter: { color: '#fff', fontSize: 40, fontWeight: '700' },
  name: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.text },
  role: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  ratingRow: { marginTop: 6 },
  rating: { fontSize: SIZES.base, color: COLORS.text },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.card, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  value: { color: COLORS.text, fontWeight: '500', fontSize: SIZES.sm },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfBtn: { flex: 1 },
  logoutBtn: { borderColor: COLORS.error },
});

export default ProfileScreen;
