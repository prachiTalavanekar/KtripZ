import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { restoreSession, fetchMe } from '../store/slices/authSlice';
import { COLORS, SIZES } from '../constants/theme';

export default function SplashScreen({ navigation }) {
  const dispatch = useDispatch();
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo pop-in then tagline fades in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();

    const init = async () => {
      // Show splash for 3.5 seconds
      await new Promise(r => setTimeout(r, 3500));

      // Try to restore existing session
      const result = await dispatch(restoreSession());

      if (result.meta.requestStatus === 'fulfilled') {
        // Logged-in user — skip onboarding, go straight to app
        const { user } = result.payload;
        navigation.replace(user.role === 'provider' ? 'ProviderTabs' : 'PassengerTabs');
        dispatch(fetchMe()).catch(() => {});
      } else {
        // Not logged in — check if first-time visitor
        const onboardingDone = await AsyncStorage.getItem('onboarding_done');
        if (onboardingDone === 'true') {
          navigation.replace('Login');
        } else {
          navigation.replace('Onboarding');
        }
      }
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>K</Text>
        </View>
        <Text style={styles.appName}>KTripZ</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Share the ride. Split the cost.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoWrap: { alignItems: 'center', gap: 16 },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoLetter: { color: '#fff', fontSize: 52, fontWeight: '800' },
  appName: { color: '#fff', fontSize: SIZES.xxxl, fontWeight: '800', letterSpacing: 3 },
  tagline: { color: 'rgba(255,255,255,0.6)', fontSize: SIZES.base, letterSpacing: 0.5 },
});
