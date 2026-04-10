import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { connectSocket } from '../../services/socket';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES } from '../../constants/theme';

const ROLES = [{ label: 'Passenger', value: 'passenger' }, { label: 'Driver / Provider', value: 'provider' }];

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'passenger' });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const result = await dispatch(register(form));
    if (result.meta.requestStatus === 'fulfilled') {
      await connectSocket();
      const role = result.payload.user.role;
      navigation.replace(role === 'provider' ? 'ProviderTabs' : 'PassengerTabs');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join KTripZ today</Text>
      {error && <Text style={styles.errorBanner}>{error}</Text>}
      <Input label="Full Name" value={form.name} onChangeText={v => set('name', v)} placeholder="John Doe" />
      <Input label="Email" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <Input label="Phone" value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" placeholder="+91 9876543210" />
      <Input label="Password" value={form.password} onChangeText={v => set('password', v)} secureTextEntry placeholder="Min 8 characters" />
      <Text style={styles.roleLabel}>I am a</Text>
      <View style={styles.roleRow}>
        {ROLES.map(r => (
          <TouchableOpacity key={r.value} style={[styles.roleBtn, form.role === r.value && styles.roleBtnActive]}
            onPress={() => set('role', r.value)}>
            <Text style={[styles.roleBtnText, form.role === r.value && styles.roleBtnTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: SIZES.base, color: COLORS.textSecondary, marginBottom: 28, marginTop: 4 },
  errorBanner: { backgroundColor: '#FEE2E2', color: COLORS.error, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: SIZES.sm },
  roleLabel: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roleBtn: { flex: 1, height: 44, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  roleBtnText: { color: COLORS.textSecondary, fontWeight: '500' },
  roleBtnTextActive: { color: '#fff' },
  btn: { marginTop: 8 },
  link: { textAlign: 'center', marginTop: 20, color: COLORS.textSecondary, fontSize: SIZES.sm },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
});

export default RegisterScreen;
