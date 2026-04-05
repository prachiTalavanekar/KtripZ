import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../constants/api';

let socket = null;

export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) return;
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const joinRideRoom = (rideId) => socket?.emit('join_ride_room', rideId);
export const joinBookingRoom = (bookingId) => socket?.emit('join_booking_room', bookingId);
export const leaveRideRoom = (rideId) => socket?.emit('leave_ride_room', rideId);
