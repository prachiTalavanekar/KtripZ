import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { restoreSession, fetchMe } from '../store/slices/authSlice';
import { connectSocket } from '../services/socket';
import { COLORS, SIZES } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const dispatch = useDispatch();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo pop-in animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const init = async () => {
      // Show splash for 3.5 seconds
      await new Promise(r => setTimeout(r, 3500));

      const result = await dispatch(restoreSession());

      if (result.meta.requestStatus === 'fulfilled') {
        const { user } = result.payload;
        await connectSocket(); // connect socket after session restore
        navigation.replace(user.role === 'provider' ? 'ProviderTabs' : 'PassengerTabs');
        dispatch(fetchMe()).catch(() => {});
      } else {
        const onboardingDone = await AsyncStorage.getItem('onboarding_done');
        navigation.replace(onboardingDone === 'true' ? 'Login' : 'Onboarding');
      }
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
    gap: 24,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.65,
    height: width * 0.65,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: SIZES.base,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
