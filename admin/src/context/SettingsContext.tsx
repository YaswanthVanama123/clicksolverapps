import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Settings Context
 * Manages app settings for admin app
 */

interface SettingsContextType {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsContextType = {
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  setSoundEnabled: () => {},
  setVibrationEnabled: () => {},
  setNotificationsEnabled: () => {},
  setAutoRefresh: () => {},
  setRefreshInterval: () => {},
  resetSettings: () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  useEffect(() => {
    // Load settings from storage on mount
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from encrypted storage
      // const settings = await SecureStorage.getObject(STORAGE_KEYS.SETTINGS);
      // if (settings) {
      //   setSoundEnabled(settings.soundEnabled ?? true);
      //   setVibrationEnabled(settings.vibrationEnabled ?? true);
      //   setNotificationsEnabled(settings.notificationsEnabled ?? true);
      //   setAutoRefresh(settings.autoRefresh ?? true);
      //   setRefreshInterval(settings.refreshInterval ?? 30000);
      // }
      console.log('Settings loaded');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // Save to encrypted storage
      // await SecureStorage.setObject(STORAGE_KEYS.SETTINGS, {
      //   soundEnabled,
      //   vibrationEnabled,
      //   notificationsEnabled,
      //   autoRefresh,
      //   refreshInterval,
      // });
      console.log('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  useEffect(() => {
    // Save settings whenever they change
    saveSettings();
  }, [soundEnabled, vibrationEnabled, notificationsEnabled, autoRefresh, refreshInterval]);

  const resetSettings = () => {
    setSoundEnabled(true);
    setVibrationEnabled(true);
    setNotificationsEnabled(true);
    setAutoRefresh(true);
    setRefreshInterval(30000);
  };

  const value: SettingsContextType = {
    soundEnabled,
    vibrationEnabled,
    notificationsEnabled,
    autoRefresh,
    refreshInterval,
    setSoundEnabled,
    setVibrationEnabled,
    setNotificationsEnabled,
    setAutoRefresh,
    setRefreshInterval,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
