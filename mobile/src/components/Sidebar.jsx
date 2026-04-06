import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

// screen: stack screen name OR { tab: 'TabName' } for tab switching
const PASSENGER_MENU = [
  { icon: 'home-outline',         label: 'Home',         nav: { tab: 'Home' } },
  { icon: 'search-outline',       label: 'Search Rides', nav: { tab: 'SearchRide' } },
  { icon: 'receipt-outline',      label: 'My Bookings',  nav: { tab: 'MyBookings' } },
  { icon: 'notifications-outline',label: 'Notifications',nav: { tab: 'Notifications' } },
  { icon: 'person-outline',       label: 'Profile',      nav: { tab: 'Profile' } },
];

const PROVIDER_MENU = [
  { icon: 'home-outline',         label: 'Home',         nav: { tab: 'Dashboard' } },
  { icon: 'bar-chart-outline',    label: 'Analytics',    nav: { stack: 'Analytics' } },
  { icon: 'add-circle-outline',   label: 'Create Ride',  nav: { tab: 'CreateRide' } },
  { icon: 'car-outline',          label: 'My Rides',     nav: { tab: 'MyRides' } },
  { icon: 'car-sport-outline',    label: 'Vehicles',     nav: { tab: 'Vehicles' } },
  { icon: 'notifications-outline',label: 'Notifications',nav: { tab: 'Notifications' } },
  { icon: 'person-outline',       label: 'Profile',      nav: { tab: 'Profile' } },
];

export default function Sidebar({ visible, onClose, navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: 240, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const menu = user?.role === 'provider' ? PROVIDER_MENU : PASSENGER_MENU;

  const handleNav = (item) => {
    onClose();
    setTimeout(() => {
      const { nav } = item;
      if (nav.stack) {
        navigation.navigateStack(nav.stack);
      } else if (nav.tab) {
        navigation.navigateTab(nav.tab);
      }
    }, 260);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      dispatch(logout());
      if (navigation.navigateRoot) {
        navigation.navigateRoot('Login');
      } else {
        navigation.navigate('Login');
      }
    }, 260);
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {menu.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => handleNav(item)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: SIDEBAR_WIDTH, backgroundColor: '#fff',
    ...SHADOWS.card, elevation: 16,
  },
  drawerHeader: {
    backgroundColor: COLORS.primary, padding: 20, paddingTop: 48,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 22, fontWeight: '800' },
  userName: { color: '#fff', fontSize: SIZES.base, fontWeight: '700' },
  userRole: { color: 'rgba(255,255,255,0.65)', fontSize: SIZES.xs, marginTop: 2 },
  closeBtn: { padding: 4 },
  menuList: { flex: 1, paddingTop: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: SIZES.base, color: COLORS.text, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  logoutText: { fontSize: SIZES.base, color: COLORS.error, fontWeight: '600' },
});
