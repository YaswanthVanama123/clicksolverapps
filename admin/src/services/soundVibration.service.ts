import { Vibration, Platform } from 'react-native';
// import Sound from 'react-native-sound'; // Uncomment if using react-native-sound

/**
 * Sound & Vibration Service
 * Handles sound effects and vibration for admin app notifications
 */

class SoundVibrationService {
  private notificationSound: any = null;
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;

  /**
   * Initialize sound service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize notification sound
      // this.notificationSound = new Sound('notification.mp3', Sound.MAIN_BUNDLE, (error) => {
      //   if (error) {
      //     console.error('Failed to load sound:', error);
      //   }
      // });
      console.log('Sound & Vibration service initialized');
    } catch (error) {
      console.error('Error initializing sound service:', error);
    }
  }

  /**
   * Play notification sound
   */
  async playNotificationSound(): Promise<void> {
    if (!this.soundEnabled) return;

    try {
      // if (this.notificationSound) {
      //   this.notificationSound.play((success: boolean) => {
      //     if (success) {
      //       console.log('Notification sound played');
      //     } else {
      //       console.error('Failed to play notification sound');
      //     }
      //   });
      // }
      console.log('Playing notification sound');
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Play success sound
   */
  async playSuccessSound(): Promise<void> {
    if (!this.soundEnabled) return;

    try {
      // Play success beep or tone
      console.log('Playing success sound');
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }

  /**
   * Play error sound
   */
  async playErrorSound(): Promise<void> {
    if (!this.soundEnabled) return;

    try {
      // Play error beep or tone
      console.log('Playing error sound');
    } catch (error) {
      console.error('Error playing error sound:', error);
    }
  }

  /**
   * Vibrate device
   * @param {string} pattern - Vibration pattern: 'short', 'long', 'pattern'
   */
  vibrate(pattern: 'short' | 'long' | 'pattern' = 'short'): void {
    if (!this.vibrationEnabled) return;

    try {
      switch (pattern) {
        case 'short':
          Vibration.vibrate(200);
          break;
        case 'long':
          Vibration.vibrate(500);
          break;
        case 'pattern':
          // Pattern: [wait, vibrate, wait, vibrate]
          Vibration.vibrate([0, 200, 100, 200]);
          break;
        default:
          Vibration.vibrate(200);
      }
      console.log(`Vibration pattern: ${pattern}`);
    } catch (error) {
      console.error('Error vibrating device:', error);
    }
  }

  /**
   * Vibrate for new order notification
   */
  vibrateForNewOrder(): void {
    this.vibrate('pattern');
    this.playNotificationSound();
  }

  /**
   * Vibrate for order acceptance
   */
  vibrateForOrderAcceptance(): void {
    this.vibrate('short');
    this.playSuccessSound();
  }

  /**
   * Vibrate for order cancellation
   */
  vibrateForOrderCancellation(): void {
    this.vibrate('long');
    this.playErrorSound();
  }

  /**
   * Vibrate for urgent notification
   */
  vibrateForUrgentNotification(): void {
    // Urgent pattern: multiple vibrations
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    this.playNotificationSound();
  }

  /**
   * Cancel all vibrations
   */
  cancelVibration(): void {
    try {
      Vibration.cancel();
      console.log('Vibration cancelled');
    } catch (error) {
      console.error('Error cancelling vibration:', error);
    }
  }

  /**
   * Enable sound
   */
  enableSound(): void {
    this.soundEnabled = true;
    console.log('Sound enabled');
  }

  /**
   * Disable sound
   */
  disableSound(): void {
    this.soundEnabled = false;
    console.log('Sound disabled');
  }

  /**
   * Enable vibration
   */
  enableVibration(): void {
    this.vibrationEnabled = true;
    console.log('Vibration enabled');
  }

  /**
   * Disable vibration
   */
  disableVibration(): void {
    this.vibrationEnabled = false;
    console.log('Vibration disabled');
  }

  /**
   * Get sound enabled status
   * @returns {boolean} Sound enabled status
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Get vibration enabled status
   * @returns {boolean} Vibration enabled status
   */
  isVibrationEnabled(): boolean {
    return this.vibrationEnabled;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      // if (this.notificationSound) {
      //   this.notificationSound.release();
      // }
      this.cancelVibration();
      console.log('Sound & Vibration service cleanup completed');
    } catch (error) {
      console.error('Error cleaning up sound service:', error);
    }
  }
}

const soundVibrationService = new SoundVibrationService();
export default soundVibrationService;
