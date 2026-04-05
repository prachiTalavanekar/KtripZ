import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { markAllRead } from '../store/slices/notificationSlice';
import Header from '../components/Header';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const NotificationsScreen = () => {
  const dispatch = useDispatch();
  const { list } = useSelector(s => s.notifications);

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack={false}
        right={
          <TouchableOpacity onPress={() => dispatch(markAllRead())}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={list}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.unread]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  markAll: { fontSize: SIZES.xs, color: COLORS.accent, fontWeight: '600' },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, marginBottom: 10, ...SHADOWS.card },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  title: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  body: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60, fontSize: SIZES.base },
});

export default NotificationsScreen;
