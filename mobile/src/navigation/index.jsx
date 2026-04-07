import React, { useState, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/passenger/HomeScreen';
import SearchRideScreen from '../screens/passenger/SearchRideScreen';
import AllRidesScreen from '../screens/passenger/AllRidesScreen';
import RideDetailsScreen from '../screens/passenger/RideDetailsScreen';
import SeatSelectionScreen from '../screens/passenger/SeatSelectionScreen';
import BookingConfirmationScreen from '../screens/passenger/BookingConfirmationScreen';
import MyBookingsScreen from '../screens/passenger/MyBookingsScreen';
import ProviderDashboard from '../screens/provider/ProviderDashboard';
import CreateRideScreen from '../screens/provider/CreateRideScreen';
import MyRidesScreen from '../screens/provider/MyRidesScreen';
import ManageRideScreen from '../screens/provider/ManageRideScreen';
import VehiclesScreen from '../screens/provider/VehiclesScreen';
import AnalyticsScreen from '../screens/provider/AnalyticsScreen';
import StopSelectionScreen from '../screens/provider/StopSelectionScreen';
import DriverTrackingScreen from '../screens/tracking/DriverTrackingScreen';
import PassengerTrackingScreen from '../screens/tracking/PassengerTrackingScreen';
import OtpVerificationScreen from '../screens/tracking/OtpVerificationScreen';
import ActiveRideScreen from '../screens/tracking/ActiveRideScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const PassengerStack = createNativeStackNavigator();
const ProviderStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  return {
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 56 + (Platform.OS === 'android' ? insets.bottom : insets.bottom || 0),
    paddingTop: 6,
    paddingBottom: Platform.OS === 'android' ? insets.bottom + 4 : insets.bottom || 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  };
}

function TabIcon({ name, focused }) {
  return (
    <Ionicons
      name={focused ? name : `${name}-outline`}
      size={22}
      color={focused ? COLORS.primary : COLORS.textSecondary}
    />
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
// stackNavRef  → nested stack (for stack screens like Analytics, ManageRide)
// tabNavRef    → tab navigator (for switching tabs)
// rootNav      → root stack (for logout → Login)
function Shell({ children, stackNavRef, tabNavRef, rootNav }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarNav = {
    // Navigate to a tab screen
    navigateTab: (tabName) => {
      tabNavRef.current?.navigate(tabName);
    },
    // Navigate to a stack screen (Analytics, ManageRide etc.)
    navigateStack: (screenName, params) => {
      stackNavRef.current?.navigate(screenName, params);
    },
    // Logout → root Login
    navigateRoot: (screenName) => {
      rootNav.navigate(screenName);
    },
    goBack: () => stackNavRef.current?.goBack(),
  };

  return (
    <View style={styles.root}>
      <TopBar
        showBack={false}
        onBack={() => stackNavRef.current?.goBack()}
        onMenuPress={() => setSidebarOpen(true)}
      />
      <View style={styles.body}>{children}</View>
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={sidebarNav}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1 },
});

// ── Passenger Tabs ────────────────────────────────────────────────────────────
function PassengerTabNav({ tabNavRef }) {
  const tabBarStyle = useTabBarStyle();
  return (
    <Tab.Navigator
      ref={tabNavRef}
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tab.Screen name="SearchRide" component={SearchRideScreen}
        options={{ tabBarLabel: 'Search', tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen}
        options={{ tabBarLabel: 'Bookings', tabBarIcon: ({ focused }) => <TabIcon name="receipt" focused={focused} /> }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen}
        options={{ tabBarLabel: 'Alerts', tabBarIcon: ({ focused }) => <TabIcon name="notifications" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

function PassengerTabs({ navigation: rootNav }) {
  const stackNavRef = useRef(null);
  const tabNavRef = useRef(null);

  const TabNav = () => <PassengerTabNav tabNavRef={tabNavRef} />;

  return (
    <Shell stackNavRef={stackNavRef} tabNavRef={tabNavRef} rootNav={rootNav}>
      <PassengerStack.Navigator ref={stackNavRef} screenOptions={{ headerShown: false }}>
        <PassengerStack.Screen name="Tabs" component={TabNav} />
        <PassengerStack.Screen name="AllRides" component={AllRidesScreen} />
        <PassengerStack.Screen name="RideDetails" component={RideDetailsScreen} />
        <PassengerStack.Screen name="SeatSelection" component={SeatSelectionScreen} />
        <PassengerStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        <PassengerStack.Screen name="Chat" component={ChatScreen} />
        <PassengerStack.Screen name="PassengerTracking" component={PassengerTrackingScreen} />
        <PassengerStack.Screen name="ActiveRide" component={ActiveRideScreen} />
      </PassengerStack.Navigator>
    </Shell>
  );
}

// ── Provider Tabs ─────────────────────────────────────────────────────────────
function ProviderTabNav({ tabNavRef }) {
  const tabBarStyle = useTabBarStyle();
  return (
    <Tab.Navigator
      ref={tabNavRef}
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Dashboard" component={ProviderDashboard}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tab.Screen name="CreateRide" component={CreateRideScreen}
        options={{ tabBarLabel: 'New Ride', tabBarIcon: ({ focused }) => <TabIcon name="add-circle" focused={focused} /> }} />
      <Tab.Screen name="MyRides" component={MyRidesScreen}
        options={{ tabBarLabel: 'My Rides', tabBarIcon: ({ focused }) => <TabIcon name="car" focused={focused} /> }} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen}
        options={{ tabBarLabel: 'Vehicles', tabBarIcon: ({ focused }) => <TabIcon name="car-sport" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

function ProviderTabs({ navigation: rootNav }) {
  const stackNavRef = useRef(null);
  const tabNavRef = useRef(null);

  const TabNav = () => <ProviderTabNav tabNavRef={tabNavRef} />;

  return (
    <Shell stackNavRef={stackNavRef} tabNavRef={tabNavRef} rootNav={rootNav}>
      <ProviderStack.Navigator ref={stackNavRef} screenOptions={{ headerShown: false }}>
        <ProviderStack.Screen name="Tabs" component={TabNav} />
        <ProviderStack.Screen name="ManageRide" component={ManageRideScreen} />
        <ProviderStack.Screen name="Analytics" component={AnalyticsScreen} />
        <ProviderStack.Screen name="Chat" component={ChatScreen} />
        <ProviderStack.Screen name="StopSelection" component={StopSelectionScreen} />
        <ProviderStack.Screen name="DriverTracking" component={DriverTrackingScreen} />
        <ProviderStack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <ProviderStack.Screen name="ActiveRide" component={ActiveRideScreen} />
      </ProviderStack.Navigator>
    </Shell>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="PassengerTabs" component={PassengerTabs} />
        <RootStack.Screen name="ProviderTabs" component={ProviderTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
