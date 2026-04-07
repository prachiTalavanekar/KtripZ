import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyRides } from '../../store/slices/rideSlice';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { format } from 'date-fns';

const TABS = [
  { key: 'all',       label: 'All',       icon: 'list-outline' },
  { key: 'scheduled', label: 'Upcoming',  icon: 'time-outline' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

const TAB_COLORS = {
  all: COLORS.text,
  scheduled: COLORS.primary,
  active: COLORS.primary, // or define a new color if you prefer, but sticking to primary for now
  completed: COLORS.success,
  cancelled: '#EF4444',
};

// ── Action Sheet Modal ────────────────────────────────────────────────────────
function ActionSheet({ visible, ride, onClose, onAction }) {
  if (!ride) return null;
  const isScheduled = ride.status === 'scheduled';

  const actions = [
    ...(isScheduled ? [
      { icon: 'pencil-outline',          label: 'Edit Ride',           key: 'edit',     color: COLORS.primary },
      { icon: 'checkmark-circle-outline',label: 'Mark as Completed',   key: 'complete', color: COLORS.success },
      { icon: 'close-circle-outline',    label: 'Cancel Ride',         key: 'cancel',   color: '#F59E0B' },
    ] : []),
    { icon: 'trash-outline', label: 'Delete Ride', key: 'delete', color: '#EF4444' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={as.overlay} activeOpacity={1} onPress={onClose} />
      <View style={as.sheet}>
        <View style={as.handle} />
        <Text style={as.title} numberOfLines={1}>
          {ride.origin?.name} → {ride.destination?.name}
        </Text>
        <Text style={as.subtitle}>
          {format(new Date(ride.departureTime), 'dd MMM yyyy, hh:mm a')}
        </Text>
        <View style={as.divider} />
        {actions.map(a => (
          <TouchableOpacity key={a.key} style={as.action} onPress={() => onAction(a.key)} activeOpacity={0.7}>
            <View style={[as.actionIcon, { backgroundColor: a.color + '15' }]}>
              <Ionicons name={a.icon} size={20} color={a.color} />
            </View>
            <Text style={[as.actionLabel, { color: a.color }]}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={as.cancelBtn} onPress={onClose}>
          <Text style={as.cancelText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const as = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: SIZES.base, fontWeight: '600' },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12, backgroundColor: COLORS.background, borderRadius: SIZES.radius },
  cancelText: { fontSize: SIZES.base, color: COLORS.textSecondary, fontWeight: '600' },
});

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ visible, ride, onClose, onSave }) {
  const [price, setPrice] = useState('');
  const [seats, setSeats] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ride) {
      setPrice(String(ride.pricePerSeat));
      setSeats(String(ride.totalSeats));
      setDesc(ride.description || '');
    }
  }, [ride]);

  const handleSave = async () => {
    if (!price || !seats) return Alert.alert('Error', 'Price and seats are required');
    setSaving(true);
    try {
      await api.put(`/rides/${ride._id}`, {
        pricePerSeat: Number(price),
        totalSeats: Number(seats),
        availableSeats: Number(seats),
        description: desc,
      });
      onSave();
      onClose();
    } catch (e) { Alert.alert('Error', e.message); }
    setSaving(false);
  };

  if (!ride) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={em.overlay} activeOpacity={1} onPress={onClose} />
      <View style={em.sheet}>
        <View style={em.handle} />
        <Text style={em.title}>Edit Ride</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Input label="Price per Seat (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <Input label="Total Seats" value={seats} onChangeText={setSeats} keyboardType="numeric" />
          <Input label="Description" value={desc} onChangeText={setDesc} multiline placeholder="Optional notes..." />
        </ScrollView>
        <View style={em.btnRow}>
          <Button title="Cancel" variant="outline" onPress={onClose} style={em.halfBtn} />
          <Button title="Save Changes" onPress={handleSave} loading={saving} style={em.halfBtn} />
        </View>
      </View>
    </Modal>
  );
}

const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  halfBtn: { flex: 1 },
});

// ── Ride Card ─────────────────────────────────────────────────────────────────
function RideCard({ ride, navigation, onPress, onLongPress, activeTab }) {
  const color = TAB_COLORS[ride.status] || COLORS.textSecondary;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.85}>
      <View style={[styles.statusBar, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.routeWrap}>
            <Ionicons name="location" size={13} color={COLORS.primary} />
            <Text style={styles.route} numberOfLines={1}>
              {ride.origin?.name} → {ride.destination?.name}
            </Text>
          </View>
          <View style={styles.cardTopRight}>
            <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
              <Text style={[styles.statusBadgeText, { color: color }]}>
                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
              </Text>
            </View>
            <TouchableOpacity onPress={onLongPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{format(new Date(ride.departureTime), 'dd MMM yyyy')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{format(new Date(ride.departureTime), 'hh:mm a')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{ride.availableSeats} seats left</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>₹{ride.pricePerSeat}</Text>
          </View>
        </View>
        {(ride.status === 'scheduled' || ride.status === 'active') && (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.getParent()?.navigate('ManageRide', { rideId: ride._id, initialTab: 'approved' })}
          >
            <Ionicons name="navigate-outline" size={14} color={COLORS.primary} />
            <Text style={styles.trackBtnText}>Track & Manage</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MyRidesScreen({ navigation }) {
  const dispatch = useDispatch();
  const { myRides, loading } = useSelector(s => s.rides);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRide, setSelectedRide] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = () => dispatch(fetchMyRides());

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = myRides.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return r.status === 'scheduled' || r.status === 'active';
    return r.status === activeTab;
  });

  const openActions = (ride) => { setSelectedRide(ride); setShowActions(true); };

  const handleAction = async (key) => {
    setShowActions(false);
    if (key === 'edit') { setTimeout(() => setShowEdit(true), 300); return; }

    const confirmMap = {
      complete: { title: 'Mark as Completed', msg: 'Mark this ride as completed?', endpoint: `/rides/${selectedRide._id}/complete` },
      cancel:   { title: 'Cancel Ride',       msg: 'Cancel this ride?',             endpoint: `/rides/${selectedRide._id}/cancel` },
      delete:   { title: 'Delete Ride',        msg: 'Permanently delete this ride?', endpoint: null, isDelete: true },
    };

    const cfg = confirmMap[key];
    if (!cfg) return;

    Alert.alert(cfg.title, cfg.msg, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: key === 'delete' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            if (cfg.isDelete) {
              await api.delete(`/rides/${selectedRide._id}`);
            } else {
              await api.patch(cfg.endpoint);
            }
            load();
          } catch (e) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const color = TAB_COLORS[tab.key];
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && { borderBottomColor: color, borderBottomWidth: 2.5 }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon} size={15} color={active ? color : COLORS.textSecondary} />
              <Text style={[styles.tabLabel, active && { color, fontWeight: '700' }]}>
                {tab.label}
              </Text>
              {myRides.filter(r => {
                if (tab.key === 'all') return true;
                if (tab.key === 'scheduled') return r.status === 'scheduled' || r.status === 'active';
                return r.status === tab.key;
              }).length > 0 && (
                <View style={[styles.badge, { backgroundColor: color }]}>
                  <Text style={styles.badgeText}>{myRides.filter(r => {
                    if (tab.key === 'all') return true;
                    if (tab.key === 'scheduled') return r.status === 'scheduled' || r.status === 'active';
                    return r.status === tab.key;
                  }).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RideCard
              ride={item}
              navigation={navigation}
              activeTab={activeTab}
              onPress={() => navigation.getParent()?.navigate('ManageRide', { rideId: item._id })}
              onLongPress={() => openActions(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No {TABS.find(t => t.key === activeTab)?.label} rides</Text>
              {activeTab === 'scheduled' && (
                <TouchableOpacity onPress={() => navigation.getParent()?.navigate('CreateRide')}>
                  <Text style={styles.emptyAction}>Create your first ride →</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Action Sheet */}
      <ActionSheet
        visible={showActions}
        ride={selectedRide}
        onClose={() => setShowActions(false)}
        onAction={handleAction}
      />

      {/* Edit Modal */}
      <EditModal
        visible={showEdit}
        ride={selectedRide}
        onClose={() => setShowEdit(false)}
        onSave={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    elevation: 2,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 13, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderRadius: SIZES.radius, marginBottom: 10,
    overflow: 'hidden', ...SHADOWS.card,
  },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  routeWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  route: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text, flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: COLORS.textSecondary },

  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#0A1F4408', borderRadius: 10,
    marginTop: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#0A1F4415',
  },
  trackBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyTitle: { fontSize: SIZES.base, color: COLORS.textSecondary, fontWeight: '500' },
  emptyAction: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm },
});
