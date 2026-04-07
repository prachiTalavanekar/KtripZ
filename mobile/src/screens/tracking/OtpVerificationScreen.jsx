import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export default function OtpVerificationScreen({ route, navigation }) {
  const { bookingId, passengerName } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    if (val && idx < 3) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 4) return Alert.alert('Invalid OTP', 'Please enter all 4 digits');
    setLoading(true);
    try {
      await api.post('/bookings/verify-otp', { bookingId, otp: otpStr });
      // Navigation handled by socket event ride_started in DriverTrackingScreen
    } catch (e) {
      Alert.alert('Wrong OTP', e.message || 'OTP does not match. Ask passenger again.');
      setOtp(['', '', '', '']);
      inputs.current[0]?.focus();
    }
    setLoading(false);
  };

  const otpStr = otp.join('');

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="keypad" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Enter Passenger OTP</Text>
        <Text style={styles.sub}>
          Ask {passengerName || 'the passenger'} for their 4-digit OTP to start the ride
        </Text>

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={r => inputs.current[i] = r}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={v => handleChange(v, i)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, otpStr.length !== 4 && styles.verifyBtnOff]}
          onPress={handleVerify}
          disabled={loading || otpStr.length !== 4}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.verifyBtnText}>Verify & Start Ride</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0A1F4412', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  sub: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  otpRow: { flexDirection: 'row', gap: 14, marginVertical: 8 },
  otpInput: {
    width: 60, height: 68, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.border,
    fontSize: 28, fontWeight: '800', color: COLORS.text,
    backgroundColor: COLORS.card, ...SHADOWS.card,
  },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: '#0A1F4408' },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingVertical: 14, width: '100%',
  },
  verifyBtnOff: { backgroundColor: COLORS.border },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
  backBtn: { paddingVertical: 8 },
  backBtnText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
});
