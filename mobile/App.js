import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { store } from './src/store';
import AppNavigator from './src/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket } from './src/services/socket';
import { RideProvider } from './src/context/RideContext';

export default function App() {
  useEffect(() => {
    // Set status bar for Android
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(false);
    }
    AsyncStorage.getItem('token').then(token => {
      if (token) connectSocket();
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <RideProvider>
            <AppNavigator />
          </RideProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
