import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Animated,
} from 'react-native';
import MapView, { Marker, Polyline, AnimatedRegion, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRideTracking } from '../../context/RideTrackingContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { decodePolyline } from '../../utils/polyline';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export default function DriverTrackingScreen({ route, navigation }) {
  const {
    bookingId,
    passengerLat, passengerLng,
    passengerName,
    originName, destinationName,
  } = route.params;

  const { updateTracking, locationWatcher } = useRideTracking();
  const mapRef = useRef(null);

  // Driver animated position
  const driverAnimCoords = useRef(new AnimatedRegion({
    latitude: 0, longitude: 0, latitudeDelta: 0.01, longitudeDelta: 0.01,
  })).current;

  const [driverCoords, setDriverCoords] = useState(null);
  const [fullRouteCoords, setFullRouteCoords] = useState([]);    // source → destination (grey)
  const [remainingCoords, setRemainingCoords] = useState([]);    // driver → destination (navy)
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const lastRouteFetch = useRef(0);

  const destinationCoords = passengerLat && passengerLng
    ? { latitude: passengerLat, longitude: passengerLng }
    : null;

  useEffect(() => {
    startTracking();
    return () => {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
        locationWatcher.current = null;
      }
    };
  }, []);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is needed for tracking');
      setLoading(false);
      return;
    }

    // Get initial position
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude } = pos.coords;

    const coords = { latitude, longitude };
    setDriverCoords(coords);
    driverAnimCoords.setValue({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    setLoading(false);

    // Fit map to show both driver and destination
    if (destinationCoords) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([coords, destinationCoords], {
          edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
          animated: true,
        });
      }, 800);
      // Fetch initial route (driver → destination) + full route (origin → destination)
      if (destinationCoords) {
        await fetchRoute(latitude, longitude, passengerLat, passengerLng);
        // Also fetch full source→destination if we have origin coords from params
        if (route.params?.originLat && route.params?.originLng) {
          fetchFullRoute(route.params.originLat, route.params.originLng, passengerLat, passengerLng);
        }
      }
    }

    // Start continuous GPS tracking every 3 seconds
    locationWatcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      (location) => {
        const { latitude: lat, longitude: lng, heading, speed } = location.coords;

        // Animate marker smoothly
        driverAnimCoords.timing({
          latitude: lat, longitude: lng,
          duration: 1000, useNativeDriver: false,
        }).start();

        setDriverCoords({ latitude: lat, longitude: lng });
        updateTracking({ driverLocation: { lat, lng, heading, speed } });

        // Emit to socket for passenger to see
        const socket = getSocket();
        socket?.emit('driver_location_update', { bookingId, lat, lng, heading, speed });

        // Refresh remaining route every 15 seconds
        const now = Date.now();
        if (destinationCoords && now - lastRouteFetch.current > 15000) {
          lastRouteFetch.current = now;
          fetchRoute(lat, lng, passengerLat, passengerLng);
        }
      }
    );
  };

  const fetchRoute = async (fromLat, fromLng, toLat, toLng) => {
    if (!toLat || !toLng) return;
    try {
      const data = await api.post('/maps/route', {
        origin: { lat: fromLat, lng: fromLng },
        destination: { lat: toLat, lng: toLng },
      });
      if (data.polyline) setRemainingCoords(decodePolyline(data.polyline));
      if (data.durationText) setEta(data.durationText);
      if (data.distanceText) setDistance(data.distanceText);
    } catch (e) { console.warn('Route fetch failed:', e.message); }
  };

  const fetchFullRoute = async (fromLat, fromLng, toLat, toLng) => {
    try {
      const data = await api.post('/maps/route', {
        origin: { lat: fromLat, lng: fromLng },
        destination: { lat: toLat, lng: toLng },
      });
      if (data.polyline) setFullRouteCoords(decodePolyline(data.polyline));
    } catch {}
  };

  const handleGenerateOtp = async () => {
    setSendingOtp(true);
    try {
      await api.post('/bookings/generate-otp', { bookingId });
      setOtpSent(true);
      Alert.alert('OTP Sent!', 'The passenger has received their OTP. Ask them to share it.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSendingOtp(false);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
      <Text style={styles.loadingText}>Getting your location...</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={driverCoords ? {
          ...driverCoords, latitudeDelta: 0.05, longitudeDelta: 0.05,
        } : undefined}
        showsUserLocation={false}
        showsTraffic={false}
      >
        {/* ── Animated Driver Marker ── */}
        {driverCoords && (
          <Marker.Animated
            coordinate={driverAnimCoords}
            title="You (Driver)"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={20} color="#fff" />
            </View>
          </Marker.Animated>
        )}

        {/* ── Destination / Passenger Pickup Marker ── */}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title={passengerName || 'Pickup Point'}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.destMarker}>
              <Ionicons name="location" size={22} color="#fff" />
            </View>
          </Marker>
        )}

        {/* ── Route Polyline — highlighted navy blue ── */}
        {/* Full route — light grey background */}
        {fullRouteCoords.length > 0 && (
          <Polyline
            coordinates={fullRouteCoords}
            strokeColor="rgba(10,31,68,0.15)"
            strokeWidth={6}
          />
        )}
        {/* Remaining route — highlighted navy */}
        {remainingCoords.length > 0 && (
          <>
            <Polyline coordinates={remainingCoords} strokeColor="rgba(10,31,68,0.25)" strokeWidth={8} />
            <Polyline coordinates={remainingCoords} strokeColor={COLORS.primary} strokeWidth={4} />
          </>
        )}
        {/* If no remaining yet, show full route highlighted */}
        {remainingCoords.length === 0 && fullRouteCoords.length === 0 && destinationCoords && driverCoords && (
          <Polyline
            coordinates={[driverCoords, destinationCoords]}
            strokeColor={COLORS.primary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* ── ETA Card ── */}
      <View style={styles.etaCard}>
        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View style={styles.dotGreen} />
            <Text style={styles.routePointText} numberOfLines={1}>{originName || 'Origin'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={styles.dotOrange} />
            <Text style={styles.routePointText} numberOfLines={1}>{destinationName || 'Destination'}</Text>
          </View>
        </View>
        <View style={styles.etaRow}>
          <View style={styles.etaItem}>
            <Ionicons name="time" size={16} color={COLORS.primary} />
            <View>
              <Text style={styles.etaValue}>{eta || '--'}</Text>
              <Text style={styles.etaLabel}>Time Left</Text>
            </View>
          </View>
          <View style={styles.etaSep} />
          <View style={styles.etaItem}>
            <Ionicons name="navigate" size={16} color={COLORS.primary} />
            <View>
              <Text style={styles.etaValue}>{distance || '--'}</Text>
              <Text style={styles.etaLabel}>Distance</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Bottom Action Card ── */}
      <View style={styles.bottomCard}>
        {!otpSent ? (
          <>
            <Text style={styles.bottomTitle}>Heading to pickup point</Text>
            <Text style={styles.bottomSub}>
              {remainingCoords.length > 0
                ? `Route loaded · ${eta || 'calculating'} away`
                : 'Press when you reach the passenger'}
            </Text>
            <TouchableOpacity
              style={[styles.arrivedBtn, sendingOtp && styles.btnDisabled]}
              onPress={handleGenerateOtp}
              disabled={sendingOtp}
              activeOpacity={0.85}
            >
              {sendingOtp
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="location" size={18} color="#fff" />
                    <Text style={styles.arrivedBtnText}>I Reached Pickup</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.bottomTitle}>OTP sent to passenger</Text>
            <Text style={styles.bottomSub}>Ask passenger for the OTP to start the ride</Text>
            <TouchableOpacity
              style={styles.otpBtn}
              onPress={() => navigation.navigate('OtpVerification', { bookingId, passengerName })}
              activeOpacity={0.85}
            >
              <Ionicons name="keypad" size={18} color="#fff" />
              <Text style={styles.otpBtnText}>Enter OTP to Start Ride</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, fontSize: SIZES.base },
  map: { flex: 1 },

  // Driver marker — navy blue car
  driverMarker: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },

  // Destination marker — accent orange
  destMarker: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },

  // ETA Card
  etaCard: {
    position: 'absolute', top: 16, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: SIZES.radius, padding: 12, ...SHADOWS.card,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  routePoint: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  dotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  routePointText: { fontSize: 10, fontWeight: '700', color: COLORS.text, flex: 1 },
  routeLine: { width: 15, height: 1, backgroundColor: COLORS.border },
  etaRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  etaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  etaValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  etaLabel: { fontSize: 9, color: COLORS.textSecondary },
  etaSep: { width: 1, height: 20, backgroundColor: COLORS.border, marginHorizontal: 8 },

  // Bottom card
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  bottomTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  bottomSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 16 },
  arrivedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.success, borderRadius: SIZES.radius, paddingVertical: 14,
  },
  arrivedBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
  otpBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14,
  },
  otpBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },
  btnDisabled: { opacity: 0.6 },
});
