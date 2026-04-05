import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getSocket, joinBookingRoom } from '../services/socket';
import { COLORS, SIZES } from '../constants/theme';

export default function ChatScreen({ route, navigation }) {
  const { bookingId, driverId, driverName } = route.params || {};
  const { user } = useSelector(s => s.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const flatRef = useRef();

  useEffect(() => {
    if (!bookingId) return;
    api.get(`/messages/${bookingId}`).then(setMessages).catch(console.error);
    joinBookingRoom(bookingId);
    const socket = getSocket();
    socket?.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd(), 100);
    });
    return () => socket?.off('new_message');
  }, [bookingId]);

  const send = async () => {
    if (!text.trim() || !bookingId) return;
    try {
      const msg = await api.post('/messages', { bookingId, receiverId: driverId, message: text.trim() });
      setMessages(prev => [...prev, msg]);
      setText('');
      setTimeout(() => flatRef.current?.scrollToEnd(), 100);
    } catch (e) { console.error(e); }
  };

  const renderMsg = ({ item }) => {
    const isMine = item.senderId?._id === user?._id || item.senderId === user?._id;
    return (
      <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
        <Text style={[styles.msgText, isMine && styles.mineText]}>{item.message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!bookingId ? (
          <View style={styles.center}>
            <Ionicons name="chatbubble-outline" size={52} color={COLORS.border} />
            <Text style={styles.noChat}>Book a ride first to start chatting</Text>
          </View>
        ) : (
          <>
            <FlatList ref={flatRef} data={messages} keyExtractor={i => i._id}
              contentContainerStyle={styles.list} renderItem={renderMsg}
              onContentSizeChange={() => flatRef.current?.scrollToEnd()} />
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={text} onChangeText={setText}
                placeholder="Type a message..." placeholderTextColor={COLORS.textSecondary} multiline />
              <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={send} disabled={!text.trim()}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noChat: { color: COLORS.textSecondary, fontSize: SIZES.base },
  list: { padding: 16, gap: 8 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, backgroundColor: COLORS.card },
  mine: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { fontSize: SIZES.base, color: COLORS.text },
  mineText: { color: '#fff' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: COLORS.inputBg,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: SIZES.base, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.border },
});
