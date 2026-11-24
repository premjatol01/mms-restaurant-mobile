import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Sound & Haptic notification service for kitchen orders and service calls.
 * Provides urgent tactile pulses and audible cues.
 */

export async function playUrgentNewOrderFeedback() {
  try {
    if (Platform.OS !== 'web') {
      // Triple urgent vibration pulse for new kitchen tickets
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 400);
    }
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

export async function playOrderReadyFeedback() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

export async function playTouchFeedback() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
  } catch (err) {
    console.warn('Selection haptic failed:', err);
  }
}
