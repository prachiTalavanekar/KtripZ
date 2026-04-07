import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getSocket, joinBookingRoom } from '../services/socket';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { format } from 'date-fns';

export default function ChatScreen({ route }) {
  const { bookingId, driverId, driverName, bookingStatus: initialStatus } = route.params || {};
  const { user } = useSelector(s => s.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [bookingStatus, setBookingStatus] = useState(initialStatus || null);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef();

  const isApproved = bookingStatus === 'approved';

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }

    // Fetch booking status if not passed
    const init = async () => {
      try {
        if (!initialStatus) {
          const bookings = await api.get('/bookings/my');
          const booking = bookings.find(b => b._id === bookingId);
          if (booking) setBookingStatus(booking.status);
        }
        // Load messages
        const msgs = await api.get(`/messages/${bookingId}`);
        setMessages(msgs);
      } catch (e) { console.error(e); }
      setLoading(false);
    };

    init();
    joinBookingRoom(bookingId);

    const socket = getSocket();

    // New message
    socket?.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd(), 100);
    });

    // Booking approved — unlock chat in real-time
    socket?.on('booking_approved', (booking) => {
      if (booking._id === bookingId || booking.bookingId === bookingId) {
        setBookingStatus('approved');
      }
    });

    // Booking cancelled/rejected — lock chat
    socket?.on('booking_cancelled', (booking) => {
      if (booking._id === bookingId) {
        setBookingStatus(booking.status);
      }
    });

    return () => {
      socket?.off('new_message');
      socket?.off('booking_approved');
      socket?.off('booking_cancelled');
    };
  }, [bookingId]);

  const send = async () => {
    if (!text.trim() || !bookingId || !isApproved) return;
    try {
      const msg = await api.post('/messages', {
        bookingId,
        receiverId: driverId,
        message: text.trim(),
      });
      setMessages(prev => [...prev, msg]);
      setText('');
      setTimeout(() => flatRef.current?.scrollToEnd(), 100);
    } catch (e) { console.error(e); }
  };

  const renderMsg = ({ item }) => {
    const isMine = item.senderId?._id === user?._id || item.senderId === user?._id;
    const time = item.createdAt ? format(new Date(item.createdAt), 'hh:mm a') : '';
    return (
      <View style={[styles.msgWrap, isMine ? styles.msgWrapMine : styles.msgWrapTheirs]}>
        {!isMine && (
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{driverName?.[0]?.toUpperCase() || 'D'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
          <Text style={[styles.msgText, isMine && styles.mineText]}>{item.message}</Text>
          <Text style={[styles.msgTime, isMine && styles.mineTime]}>{time}</Text>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );

  // No booking ID — pre-booking state
  if (!bookingId) return (
    <View style={styles.center}>
      <View style={styles.lockIconWrap}>
        <Ionicons name="chatbubble-outline" size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.lockTitle}>Chat Unavailable</Text>
      <Text style={styles.lockSub}>Book a ride first to chat with the driver</Text>
    </View>
  );

  // Booking exists but not approved yet
  if (!isApproved && bookingStatus !== null) return (
    <View style={styles.center}>
      <View style={styles.lockIconWrap}>
        <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.lockTitle}>
        {bookingStatus === 'pending' ? 'Waiting for Approval' : 'Chat Unavailable'}
      </Text>
      <Text style={styles.lockSub}>
        {bookingStatus === 'pending'
          ? 'Chat will be unlocked once the driver approves your booking'
          : 'This booking has been ' + bookingStatus}
      </Text>
      {bookingStatus === 'pending' && (
        <View style={styles.pendingBadge}>
          <Ionicons name="hourglass-outline" size={14} color="#F59E0B" />
          <Text style={styles.pendingText}>Pending driver approval...</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Chat header info */}
      <View style={styles.chatHeader}>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{driverName?.[0]?.toUpperCase() || 'D'}</Text>
        </View>
        <View>
          <Text style={styles.chatName}>{driverName || 'Driver'}</Text>
          <View style={styles.approvedBadge}>
            <Ionicons name="checkmark-circle" size={11} color={COLORS.success} />
            <Text style={styles.approvedText}>Booking Approved · Chat Active</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={i => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderMsg}
          onContentSizeChange={() => flatRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnOff]}
            onPress={send}
            disabled={!text.trim()}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },

  lockIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0A1F4410',
    alignItems: 'center', justifyContent: 'center',
  },
  lockTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  lockSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  pendingText: { fontSize: SIZES.sm, color: '#92400E', fontWeight: '600' },

  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    ...SHADOWS.card,
  },
  chatAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  chatAvatarText: { color: '#fff', fontSize: SIZES.lg, fontWeight: '800' },
  chatName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  approvedText: { fontSize: SIZES.xs, color: COLORS.success, fontWeight: '600' },

  list: { padding: 16, gap: 10, paddingBottom: 8 },
  emptyChat: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyChatText: { fontSize: SIZES.sm, color: COLORS.textSecondary },

  msgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  msgWrapMine: { justifyContent: 'flex-end' },
  msgWrapTheirs: { justifyContent: 'flex-start' },
  avatarSmall: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#0A1F4420', alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  bubble: {
    maxWidth: '72%', padding: 12, borderRadius: 16,
    backgroundColor: COLORS.card, ...SHADOWS.card,
  },
  mine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirs: {
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: SIZES.base, color: COLORS.text, lineHeight: 20 },
  mineText: { color: '#fff' },
  msgTime: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },
  mineTime: { color: 'rgba(255,255,255,0.6)' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: COLORS.inputBg, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: SIZES.base, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: COLORS.border },
});
