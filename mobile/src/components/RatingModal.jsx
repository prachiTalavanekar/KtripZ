import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import api from '../services/api';
import Button from './Button';

export default function RatingModal({ visible, bookingId, rideId, driverId, onComplete }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a rating');
    setLoading(true);
    try {
      await api.post('/reviews', {
        bookingId,
        rideId,
        revieweeId: driverId,
        rating,
        comment,
      });
      onComplete();
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconWrap}>
            <Ionicons name="star" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.title}>How was your ride?</Text>
          <Text style={styles.sub}>Rate your experience with the driver</Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Ionicons
                  name={rating >= s ? "star" : "star-outline"}
                  size={32}
                  color={rating >= s ? COLORS.accent : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Tell us more (optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />

          <View style={styles.btnRow}>
            <Button
              title="Skip"
              variant="outline"
              onPress={onComplete}
              style={styles.btn}
              disabled={loading}
            />
            <Button
              title="Submit"
              onPress={handleSubmit}
              loading={loading}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modal: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 12, ...SHADOWS.card,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.accent + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  starRow: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  input: {
    width: '100%', minHeight: 80, backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, padding: 12, fontSize: SIZES.base,
    color: COLORS.text, textAlignVertical: 'top',
  },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  btn: { flex: 1 },
});
