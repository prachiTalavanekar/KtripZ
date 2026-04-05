import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';

const Header = ({ title, showBack = true, right }) => {
  const navigation = useNavigation();
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        {showBack
          ? <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          : <View style={styles.backBtn} />
        }
        <Text style={styles.title}>{title}</Text>
        <View style={styles.right}>{right || null}</View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 14,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 22 },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },
  right: { width: 36, alignItems: 'flex-end' },
});

export default Header;
