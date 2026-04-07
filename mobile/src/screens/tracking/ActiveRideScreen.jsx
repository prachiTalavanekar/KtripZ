import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, AnimatedRegion, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { decodePolyline } from '../../utils/polyline';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import RatingModal from '../../components/RatingModal';

export default function ActiveRideScreen({ route, navigation }) {
  const { bookingId, driverName, isDriver } = route.params;
  const { user } = useSelector(s => s.auth);
  const mapRef = useRef(null);

  const [myLocation, setMyLocation] = useState(null);
  const [fullRouteCoords, setFullRouteCoords] = useState([]);   // source → destination
  const [remainingCoords, setRemainingCoords] = useState([]);   // you → destination
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [originName, setOriginName] = useState('');
  const [destName, setDestName] = useState('');
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rideId, setRideId] = useState(null);
  const [driverId, setDriverId] = useState(null);

  const driverAnimCoords = useRef(new AnimatedRegion({
    latitude: 0, longitude: 0, latitudeDelta: 0.01, longitudeDelta: 0.01,
  })).current;
  const [driverVisible, setDriverVisible] = useState(false);
  const myLocationRef = useRef(null);

  useEffect(() => {
    initTracking();
    const socket = getSocket();

    if (!isDriver) {
      // Passenger: listen for driver location
      socket?.on('driver_location_update', (data) => {
        if (data.bookingId !== bookingId) return;
        setDriverVisible(true);
        driverAnimCoords.timing({ latitude: data.lat, longitude: data.lng, duration: 800, useNativeDriver: false }).start();
        // Update remaining route from driver to destination
        if (destCoords) {
          fetchRemainingRoute(data.lat, data.lng, destCoords.latitude, destCoords.longitude);
        }
      });
    }

    socket?.on('ride_completed', (data) => {
      if (data.bookingId !== bookingId) return;
      if (isDriver) {
        Alert.alert('Success', 'Ride completed successfully!', [
          { text: 'OK', onPress: () => navigation.replace('Tabs') }
        ]);
      } else {
        setShowRating(true);
      }
    });

    return () => {
      socket?.off('driver_location_update');
      socket?.off('ride_completed');
    };
  }, [bookingId, destCoords]);

  const initTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setMyLocation(coords);
      myLocationRef.current = coords;
    }

    // Fetch ride details
    try {
      const bookings = isDriver ? await api.get('/bookings/driver/pending') : await api.get('/bookings/my');
      const booking = Array.isArray(bookings) ? bookings.find(b => b._id === bookingId) : null;
      const ride = booking?.rideId;

      if (ride) {
        setRideId(ride._id);
        const oLat = ride.origin?.coordinates?.lat;
        const oLng = ride.origin?.coordinates?.lng;
        const dLat = ride.destination?.coordinates?.lat;
        const dLng = ride.destination?.coordinates?.lng;

        setOriginName(ride.origin?.name || 'Origin');
        setDestName(ride.destination?.name || 'Destination');
        if (isDriver) setDriverId(ride.driverId);
        else setDriverId(booking.rideId?.driverId); // assuming it might be partially populated or was in params

        if (oLat && oLng) setOriginCoords({ latitude: oLat, longitude: oLng });
        if (dLat && dLng) {
          const dc = { latitude: dLat, longitude: dLng };
          setDestCoords(dc);

          // Fetch full route
          if (oLat && oLng) {
            await fetchFullRoute(oLat, oLng, dLat, dLng);
          }

          // Fetch initial remaining route
          if (myLocationRef.current) {
            await fetchRemainingRoute(myLocationRef.current.latitude, myLocationRef.current.longitude, dLat, dLng);
          }

          // Fit map
          setTimeout(() => {
            const points = [];
            if (oLat && oLng) points.push({ latitude: oLat, longitude: oLng });
            points.push(dc);
            if (myLocationRef.current) points.push(myLocationRef.current);

            mapRef.current?.fitToCoordinates(points, {
              edgePadding: { top: 180, right: 60, bottom: 280, left: 60 },
              animated: true,
            });
          }, 800);
        }
      }
    } catch (e) { console.warn('Init tracking error:', e.message); }

    setLoading(false);
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

  const handleCompleteRide = async () => {
    Alert.alert('Complete Ride', 'Confirm ride completion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', onPress: async () => {
          setCompleting(true);
          try {
            await api.post('/bookings/complete-ride', { bookingId });
          } catch (e) { Alert.alert('Error', e.message); }
          setCompleting(false);
        },
      },
    ]);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={myLocation ? { ...myLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined}
      >
        {/* Origin Marker */}
        {originCoords && (
          <Marker coordinate={originCoords} title={originName} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.originMarker}>
              <Ionicons name="radio-button-on" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destCoords && (
          <Marker coordinate={destCoords} title={destName} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.destMarker}>
              <Ionicons name="location" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* You/Driver Marker */}
        {myLocation && (
          <Marker coordinate={myLocation} title="You" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.myMarker}>
              <Ionicons name={isDriver ? 'car' : 'person'} size={14} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Driver marker for passenger view */}
        {!isDriver && driverVisible && (
          <Marker.Animated coordinate={driverAnimCoords} title="Driver" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={18} color="#fff" />
            </View>
          </Marker.Animated>
        )}

        {/* Full route - light grey */}
        {fullRouteCoords.length > 0 && (
          <Polyline
            coordinates={fullRouteCoords}
            strokeColor="rgba(10,31,68,0.15)"
            strokeWidth={6}
          />
        )}

        {/* Remaining route - navy highlight */}
        {remainingCoords.length > 0 && (
          <>
            <Polyline coordinates={remainingCoords} strokeColor="rgba(10,31,68,0.25)" strokeWidth={8} />
            <Polyline coordinates={remainingCoords} strokeColor={COLORS.primary} strokeWidth={4} />
          </>
        )}
      </MapView>

      {/* ETA Card */}
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
      </View>

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Ride In Progress</Text>
      </View>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.rideInfo}>
          <Ionicons name="car-sport" size={20} color={COLORS.primary} />
          <Text style={styles.rideInfoText}>
            {isDriver ? 'Ride in progress' : `Riding with ${driverName || 'Driver'}`}
          </Text>
        </View>
        {isDriver && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleCompleteRide}
            disabled={completing}
            activeOpacity={0.85}
          >
            {completing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="flag" size={18} color="#fff" />
                  <Text style={styles.completeBtnText}>Complete Ride</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Rating Modal */}
      {!isDriver && (
        <RatingModal
          visible={showRating}
          bookingId={bookingId}
          rideId={rideId}
          driverId={driverId}
          onComplete={() => navigation.replace('Tabs')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },
  myMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  driverMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  statusBanner: { position: 'absolute', top: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  statusText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36, ...SHADOWS.card },
  rideInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  rideInfoText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, borderRadius: SIZES.radius, paddingVertical: 14 },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.base },

  // New tracking styles
  originMarker: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  destMarker: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  etaCard: {
    position: 'absolute', top: 80, left: 16, right: 16,
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
});
