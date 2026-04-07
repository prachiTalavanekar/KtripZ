import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { markAllRead } from '../store/slices/notificationSlice';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function NotificationsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list } = useSelector(s => s.notifications);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {list.length > 0 && (
          <TouchableOpacity onPress={() => dispatch(markAllRead())}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={list}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.unread]}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifBody}>{item.body}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={52} color={COLORS.border} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text },
  markAll: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  list: { padding: 16, paddingTop: 4 },
  card: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...SHADOWS.card,
  },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0A1F4412', alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  notifBody: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textSecondary },
});
