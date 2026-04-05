import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { COLORS } from '../constants/theme';

/**
 * AppShell wraps the entire tab navigator.
 * TopBar is always visible and fixed at the top.
 * Sidebar slides over everything.
 */
export default function AppShell({ children, navigation, showBack = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={styles.root}>
      <TopBar
        showBack={showBack}
        onBack={() => navigation.goBack()}
        onMenuPress={() => setSidebarOpen(true)}
      />
      <View style={styles.body}>
        {children}
      </View>
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1 },
});
