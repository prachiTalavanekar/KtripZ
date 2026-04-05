import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { COLORS } from '../constants/theme';

/**
 * Layout is used by stack screens (RideDetails, Chat, Analytics, etc.)
 * It always shows a back arrow + the menu button.
 */
export default function Layout({ children, navigation, showBack = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={styles.root}>
      <TopBar
        showBack={showBack}
        onBack={() => navigation.goBack()}
        onMenuPress={() => setSidebarOpen(true)}
      />
      <View style={styles.content}>
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
  content: { flex: 1 },
});
