import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Animated,
  TouchableOpacity, Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'car-sport',
    iconBg: ['#0A1F44', '#1A3A6B'],
    accentColor: '#4F8EF7',
    title: 'Share Your Ride',
    subtitle: 'Find intercity rides going your way',
    description:
      'Connect with drivers heading to your destination. Split the cost, reduce traffic, and travel smarter across India.',
    bg: '#EEF4FF',
  },
  {
    id: '2',
    icon: 'wallet',
    iconBg: ['#065F46', '#059669'],
    accentColor: '#10B981',
    title: 'Save Big on Travel',
    subtitle: 'Up to 70% cheaper than trains & buses',
    description:
      'Pay only your share of the fuel cost. No hidden charges, no surge pricing — just honest, affordable travel.',
    bg: '#ECFDF5',
  },
  {
    id: '3',
    icon: 'shield-checkmark',
    iconBg: ['#7C3AED', '#A855F7'],
    accentColor: '#8B5CF6',
    title: 'Safe & Trusted',
    subtitle: 'Verified drivers, real-time tracking',
    description:
      'Every ride is backed by ratings, reviews, and in-app chat. Travel with confidence knowing your journey is secure.',
    bg: '#F5F3FF',
  },
];

function Slide({ item }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.slideInner, { backgroundColor: item.bg }]}>
        {/* Illustration */}
        <Animated.View style={[styles.illustrationWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <LinearGradient colors={item.iconBg} style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <Ionicons name={item.icon} size={72} color="#fff" />
            </View>
          </LinearGradient>
          {/* Decorative rings */}
          <View style={[styles.ring, styles.ring1, { borderColor: item.accentColor + '30' }]} />
          <View style={[styles.ring, styles.ring2, { borderColor: item.accentColor + '18' }]} />
        </Animated.View>

        {/* Text */}
        <View style={styles.textWrap}>
          <View style={[styles.badge, { backgroundColor: item.accentColor + '18' }]}>
            <Text style={[styles.badgeText, { color: item.accentColor }]}>{item.subtitle}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Login');
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Login');
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => <Slide item={item} />}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: COLORS.primary }]}
              />
            );
          })}
        </View>

        {/* Button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.nextBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
            <Ionicons name={isLast ? 'rocket-outline' : 'arrow-forward'} size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity onPress={handleSkip} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skipBtn: { position: 'absolute', top: 52, right: 20, zIndex: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)' },
  skipText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },

  slide: { flex: 1 },
  slideInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80 },

  illustrationWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 48, position: 'relative' },
  iconCircleOuter: {
    width: 180, height: 180, borderRadius: 90,
    alignItems: 'center', justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  iconCircleInner: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5 },
  ring1: { width: 220, height: 220 },
  ring2: { width: 270, height: 270 },

  textWrap: { alignItems: 'center', gap: 12 },
  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: SIZES.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, textAlign: 'center', lineHeight: 36 },
  description: { fontSize: SIZES.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },

  bottom: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16, backgroundColor: '#fff', alignItems: 'center', gap: 16 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 10 },
  dot: { height: 8, borderRadius: 4 },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 50, width: width - 48,
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  nextBtnText: { color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },

  loginLink: { paddingVertical: 4 },
  loginLinkText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  loginLinkBold: { color: COLORS.primary, fontWeight: '700' },
});
