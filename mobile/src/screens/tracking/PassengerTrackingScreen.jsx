import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal,
} from 'react-native';
import MapView, { Marker, Polyline, AnimatedRegion, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRideTracking } from '../../context/RideTrackingContext';
import { getSocket, joinBookingRoom } from '../../services/socket';
import api from '../../services/api';
import { decodePolyline } from '../../utils/polyline';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export default function PassengerTrackingScreen({ route, navigation }) {
  const { bookingId, driverName, rideId } = route.params;
  const { updateTracking } = useRideTracking();
  const mapRef = useRef(null);

  const [myLocation, setMyLocation] = useState(null);
  const [fullRouteCoords, setFullRouteCoords] = useState([]);   // source → destination
  const [remainingCoords, setRemainingCoords] = useState([]);   // driver → destination
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [originName, setOriginName] = useState('');
  const [destName, setDestName] = useState('');
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [driverArrived, setDriverArrived] = useState(false);

  const driverAnimCoords = useRef(new AnimatedRegion({
    latitude: 0, longitude: 0, latitudeDelta: 0, longitudeDelta: 0,
  })).current;
  const [driverVisible, setDriverVisible] = useState(false);
  const myLocationRef = useRef(null);

  useEffect(() => {
    initTracking();
    joinBookingRoom(bookingId);
    const socket = getSocket();

    socket?.on('driver_location_update', (data) => {
      if (data.bookingId !== bookingId) return;
      const { lat, lng } = data;
      setDriverVisible(true);
      updateTracking({ driverLocation: { lat, lng } });
      driverAnimCoords.timing({ latitude: lat, longitude: lng, duration: 800, useNativeDriver: false }).start();

      // Update remaining route from driver to destination
      if (destCoords) {
        fetchRemainingRoute(lat, lng, destCoords.latitude, destCoords.longitude);
      }
    });

    socket?.on('pickup_otp_generated', (data) => {
      if (data.bookingId !== bookingId) return;
      setOtp(data.otp);
      setDriverArrived(true);
      setOtpModal(true);
    });

    socket?.on('ride_started', (data) => {
      if (data.bookingId !== bookingId) return;
      setOtpModal(false);
      navigation.replace('ActiveRide', { bookingId, driverName });
    });

    return () => {
      socket?.off('driver_location_update');
      socket?.off('pickup_otp_generated');
      socket?.off('ride_started');
    };
  }, [bookingId, destCoords]);

  const initTracking = async () => {
    // Get passenger location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setMyLocation(coords);
      myLocationRef.current = coords;
    }

    // Fetch ride details to get source + destination coordinates
    try {
      const bookings = await api.get('/bookings/my');
      const booking = bookings.find(b => b._id === bookingId);
      const ride = booking?.rideId;

      if (ride) {
        const oLat = ride.origin?.coordinates?.lat;
        const oLng = ride.origin?.coordinates?.lng;
        const dLat = ride.destination?.coordinates?.lat;
        const dLng = ride.destination?.coordinates?.lng;

        setOriginName(ride.origin?.name || 'Origin');
        setDestName(ride.destination?.name || 'Destination');

        if (oLat && oLng) setOriginCoords({ latitude: oLat, longitude: oLng });
        if (dLat && dLng) {
          const dc = { latitude: dLat, longitude: dLng };
          setDestCoords(dc);

          // Fetch full source → destination route
          if (oLat && oLng) {
            await fetchFullRoute(oLat, oLng, dLat, dLng);
          }

          // Fit map to show full route
          const points = [];
          if (oLat && oLng) points.push({ latitude: oLat, longitude: oLng });
          points.push(dc);
          if (myLocationRef.current) points.push(myLocationRef.current);

          setTimeout(() => {
            if (points.length > 1) {
              mapRef.current?.fitToCoordinates(points, {
                edgePadding: { top: 140, right: 60, bottom: 260, left: 60 },
                animated: true,
              });
            }
          }, 800);
        }
      }
    } catch (e) { console.warn('Ride fetch error:', e.message); }

    setLoading(false);
  };

  const fetchFullRoute = async (fromLat, fromLng, toLat, toLng) => {
    try {
      const data = await api.post('/maps/route', {
        origin: { lat: fromLat, lng: fromLng },
        destination: { lat: toLat, lng: toLng },
      });
      if (data.polyline) setFullRouteCoords(decodePolyline(data.polyline));
      if (data.durationText) setEta(data.durationText);
      if (data.distanceText) setDistance(data.distanceText);
    } catch {}
  };

  const fetchRemainingRoute = async (fromLat, fromLng, toLat, toLng) => {
    try {
      const data = await api.post('/maps/route', {
        origin: { lat: fromLat, lng: fromLng },
        destination: { lat: toLat, lng: toLng },
      });
      if (data.polyline) setRemainingCoords(decodePolyline(data.polyline));
      if (data.durationText) setEta(data.durationText);
      if (data.distanceText) setDistance(data.distanceText);
    } catch {}
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
      <Text style={styles.loadingText}>Loading map...</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={myLocation
          ? { ...myLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
          : undefined}
      >
        {/* ── Origin marker (green) ── */}
        {originCoords && (
          <Marker coordinate={originCoords} title={originName} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.originMarker}>
              <Ionicons name="radio-button-on" size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {/* ── Destination marker (orange) ── */}
        {destCoords && (
          <Marker coordinate={destCoords} title={destName} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.destMarker}>
              <Ionicons name="location" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* ── Passenger pickup marker (navy) ── */}
        {myLocation && (
          <Marker coordinate={myLocation} title="Your Pickup" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.myMarker}>
              <Ionicons name="person" size={14} color="#fff" />
            </View>
          </Marker>
        )}

        {/* ── Animated driver marker (yellow) ── */}
        {driverVisible && (
          <Marker.Animated coordinate={driverAnimCoords} title={driverName || 'Driver'} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={18} color="#fff" />
            </View>
          </Marker.Animated>
        )}

        {/* ── Full route — light grey (source → destination) ── */}
        {fullRouteCoords.length > 0 && (
          <Polyline
            coordinates={fullRouteCoords}
            strokeColor="rgba(10,31,68,0.15)"
            strokeWidth={6}
          />
        )}

        {/* ── Remaining route — highlighted navy (driver → destination) ── */}
        {remainingCoords.length > 0 && (
          <>
            <Polyline coordinates={remainingCoords} strokeColor="rgba(10,31,68,0.25)" strokeWidth={8} />
            <Polyline coordinates={remainingCoords} strokeColor={COLORS.primary} strokeWidth={4} />
          </>
        )}

        {/* ── If no driver yet, show full route highlighted ── */}
        {!driverVisible && fullRouteCoords.length > 0 && (
          <>
            <Polyline coordinates={fullRouteCoords} strokeColor="rgba(10,31,68,0.25)" strokeWidth={8} />
            <Polyline coordinates={fullRouteCoords} strokeColor={COLORS.primary} strokeWidth={4} />
          </>
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
            <Text style={styles.routePointText} numberOfLines={1}>{destName || 'Destination'}</Text>
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
        {driverArrived && (
          <View style={styles.arrivedBanner}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.arrivedText}>Driver arrived! Share your OTP.</Text>
          </View>
        )}
      </View>

      {/* ── Bottom Card ── */}
      <View style={styles.bottomCard}>
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>{driverName?.[0]?.toUpperCase() || 'D'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driverName || 'Your Driver'}</Text>
            <Text style={styles.driverSub}>
              {driverArrived ? 'Driver has arrived at pickup' : driverVisible ? 'Driver is on the way' : 'Waiting for driver to start'}
            </Text>
          </View>
          {driverArrived && (
            <TouchableOpacity style={styles.otpBtn} onPress={() => setOtpModal(true)}>
              <Ionicons name="keypad" size={14} color="#fff" />
              <Text style={styles.otpBtnText}>OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── OTP Modal ── */}
      <Modal visible={otpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.otpModal}>
            <View style={styles.otpIconWrap}>
              <Ionicons name="location" size={32} color={COLORS.success} />
            </View>
            <Text style={styles.otpTitle}>Driver Arrived!</Text>
            <Text style={styles.otpSub}>Share this OTP with your driver to start the ride</Text>
            <View style={styles.otpBox}>
              {otp.split('').map((d, i) => (
                <View key={i} style={styles.otpDigit}>
                  <Text style={styles.otpDigitText}>{d}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.otpNote}>Do not share with anyone else</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOtpModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, fontSize: SIZES.base },
  map: { flex: 1 },

  originMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', elevation: 4 },
  destMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4A261', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', elevation: 4 },
  myMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', elevation: 4 },
  driverMarker: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff', elevation: 6 },

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
  arrivedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  arrivedText: { fontSize: SIZES.xs, color: COLORS.success, fontWeight: '600' },

  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  driverAvatarText: { color: '#fff', fontSize: SIZES.xl, fontWeight: '800' },
  driverName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  driverSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  otpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  otpBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  otpModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center', gap: 12 },
  otpIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  otpTitle: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  otpSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  otpBox: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  otpDigit: { width: 58, height: 66, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  otpDigitText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  otpNote: { fontSize: SIZES.xs, color: COLORS.error },
  closeBtn: { backgroundColor: COLORS.background, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 20 },
  closeBtnText: { color: COLORS.textSecondary, fontWeight: '600' },
});
