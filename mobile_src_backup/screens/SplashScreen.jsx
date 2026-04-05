import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { fetchMe } from '../store/slices/authSlice';
import { COLORS, SIZES } from '../constants/theme';

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50 }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const init = async () => {
      await new Promise(r => setTimeout(r, 2000));
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const result = await dispatch(fetchMe());
        if (result.meta.requestStatus === 'fulfilled') {
          const role = result.payload.role;
          navigation.replace(role === 'provider' ? 'ProviderTabs' : role === 'admin' ? 'AdminDashboard' : 'PassengerTabs');
          return;
        }
      }
      navigation.replace('Auth');
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.appName}>KTripZ</Text>
        <Text style={styles.tagline}>Share the ride. Split the cost.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center' },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },
  logoText: { color: '#fff', fontSize: 48, fontWeight: '800' },
  appName: { color: '#fff', fontSize: SIZES.xxxl, fontWeight: '800', letterSpacing: 2 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.md, marginTop: 8 },
});

export default SplashScreen;
