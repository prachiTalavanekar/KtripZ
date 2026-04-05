import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';

export default function Header({ title, showBack = true, right }) {
  const navigation = useNavigation();
  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backIcon}>{'←'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>{right || null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 14 : 14,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 22 },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },
  right: { width: 36, alignItems: 'flex-end' },
});
