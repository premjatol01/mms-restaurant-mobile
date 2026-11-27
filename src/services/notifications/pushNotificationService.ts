import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient } from '../api/client';
import { playUrgentNewOrderFeedback } from '../audio/soundService';

const CACHED_PUSH_TOKEN_KEY = 'tablly_device_push_token';

// 1. Configure foreground notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Creates high-priority notification channels for Android.
 * Essential for Heads-Up popup banners and Lock-Screen visibility.
 */
export async function createNotificationChannelsAsync() {
  if (Platform.OS === 'android') {
    // Channel for orders & bill requests (MAX importance = heads-up popup banner)
    await Notifications.setNotificationChannelAsync('orders-alerts', {
      name: 'Orders & Settlement Alerts',
      description: 'High-priority alerts for new orders and bill requests',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D9480F',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      enableVibrate: true,
      bypassDnd: false,
    });

    // Channel for waiter calls
    await Notifications.setNotificationChannelAsync('waiter-calls', {
      name: 'Waiter & Steward Calls',
      description: 'Alerts when customers request waiter assistance at their table',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: '#D9480F',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      enableVibrate: true,
    });
  }
}

/**
 * Requests notification permissions from the OS, retrieves the Expo Push Token,
 * and registers it with the backend API.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await createNotificationChannelsAsync();

  // Push notifications require a physical device on Android / iOS
  if (!Device.isDevice) {
    console.log('[Push] Must use a physical device for remote push notifications');
    return null;
  }

  // 1. Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 2. Request if not yet granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Notification permission not granted');
    return null;
  }

  // 3. Obtain Expo Push Token
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;

    // 4. Send token to backend API if not already sent
    const cachedToken = await AsyncStorage.getItem(CACHED_PUSH_TOKEN_KEY).catch(() => null);
    if (token && token !== cachedToken) {
      await apiClient.post('/auth/push-token', { pushToken: token });
      await AsyncStorage.setItem(CACHED_PUSH_TOKEN_KEY, token);
      console.log('[Push] Push token registered with backend:', token);
    }

    return token;
  } catch (error: any) {
    console.error('[Push] Error getting push token:', error?.message);
    return null;
  }
}

/**
 * Sets up listeners for when notifications arrive or when user taps the popup banner.
 */
export function setupPushNotificationListeners() {
  // Listener 1: Notification arrives while app is open
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    // Play haptic audio feedback
    playUrgentNewOrderFeedback();
  });

  // Listener 2: User taps notification on lock-screen or notification tray
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    handleNotificationNavigation(data);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Deep links user to the relevant screen when clicking the notification.
 */
function handleNotificationNavigation(data: any) {
  if (!data) return;

  const category = data.category || '';
  const actionUrl = data.actionUrl || '';

  if (category === 'waiter_call' || actionUrl.includes('tables') || actionUrl.includes('calls')) {
    router.push('/(app)/calls');
  } else if (actionUrl.includes('settlement') || actionUrl.includes('billing')) {
    router.push('/(app)/billing');
  } else {
    // Default to orders screen
    router.push('/(app)/orders');
  }
}
