import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES } from '../../constants/theme';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLogin = async () => {
    const result = await dispatch(login(form));
    if (result.meta.requestStatus === 'fulfilled') {
      const role = result.payload.user.role;
      navigation.replace(role === 'provider' ? 'ProviderTabs' : 'PassengerTabs');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.logo}>KTripZ</Text>
        <Text style={styles.subtitle}>Welcome back</Text>
      </View>
      {error && <Text style={styles.errorBanner}>{error}</Text>}
      <Input label="Email" value={form.email} onChangeText={v => set('email', v)}
        keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <Input label="Password" value={form.password} onChangeText={v => set('password', v)}
        secureTextEntry placeholder="••••••••" />
      <Button title="Login" onPress={handleLogin} loading={loading} style={styles.btn} />
      <TouchableOpacity onPress={() => { dispatch(clearError()); navigation.navigate('Register'); }}>
        <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 36 },
  logo: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: SIZES.lg, color: COLORS.textSecondary, marginTop: 4 },
  errorBanner: { backgroundColor: '#FEE2E2', color: COLORS.error, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: SIZES.sm },
  btn: { marginTop: 8 },
  link: { textAlign: 'center', marginTop: 20, color: COLORS.textSecondary, fontSize: SIZES.sm },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
});

export default LoginScreen;
