import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { store } from './src/store';
import AppNavigator from './src/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket } from './src/services/socket';
import { RideProvider } from './src/context/RideContext';
import { RideTrackingProvider } from './src/context/RideTrackingContext';

// Keep splash visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          ...MaterialIcons.font,
          ...FontAwesome.font,
        });
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    };

    loadFonts();

    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(false);
    }

    AsyncStorage.getItem('token').then(token => {
      if (token) connectSocket();
    });
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <RideProvider>
            <RideTrackingProvider>
              <AppNavigator />
            </RideTrackingProvider>
          </RideProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
