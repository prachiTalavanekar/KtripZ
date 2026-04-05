import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { COLORS } from '../constants/theme';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/passenger/HomeScreen';
import SearchRideScreen from '../screens/passenger/SearchRideScreen';
import RideDetailsScreen from '../screens/passenger/RideDetailsScreen';
import MyBookingsScreen from '../screens/passenger/MyBookingsScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProviderDashboard from '../screens/provider/ProviderDashboard';
import CreateRideScreen from '../screens/provider/CreateRideScreen';
import ManageRideScreen from '../screens/provider/ManageRideScreen';
import VehiclesScreen from '../screens/provider/VehiclesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (icon) => ({ focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
);

const tabBarStyle = {
  backgroundColor: COLORS.card,
  borderTopColor: COLORS.border,
  height: 60,
  paddingBottom: 8,
};

const PassengerTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: COLORS.primary }}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('🏠'), tabBarLabel: 'Home' }} />
    <Tab.Screen name="SearchRide" component={SearchRideScreen} options={{ tabBarIcon: tabIcon('🔍'), tabBarLabel: 'Search' }} />
    <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ tabBarIcon: tabIcon('📋'), tabBarLabel: 'Bookings' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarIcon: tabIcon('🔔'), tabBarLabel: 'Alerts' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('👤'), tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const ProviderTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: COLORS.primary }}>
    <Tab.Screen name="Dashboard" component={ProviderDashboard} options={{ tabBarIcon: tabIcon('📊'), tabBarLabel: 'Dashboard' }} />
    <Tab.Screen name="CreateRide" component={CreateRideScreen} options={{ tabBarIcon: tabIcon('➕'), tabBarLabel: 'New Ride' }} />
    <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ tabBarIcon: tabIcon('🚗'), tabBarLabel: 'Vehicles' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarIcon: tabIcon('🔔'), tabBarLabel: 'Alerts' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('👤'), tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={LoginScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
      <Stack.Screen name="ProviderTabs" component={ProviderTabs} />
      <Stack.Screen name="RideDetails" component={RideDetailsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ManageRide" component={ManageRideScreen} />
      <Stack.Screen name="MyRides" component={ManageRideScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
