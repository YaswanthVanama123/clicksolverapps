import React, {useState, useEffect, memo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useTheme} from '../../../context/ThemeContext';
import {GRADIENTS} from '../../../theme/gradients';
import {getColors} from '../../../theme/colors';

const QUICK_ACTION_ICONS = {
  electrician: 'flash',
  plumber: 'water',
  cleaning: 'broom',
  painter: 'color-palette',
  mechanic: 'construct',
  carpenter: 'hammer',
  appliance: 'settings',
  pest: 'bug',
};

const QUICK_ACTION_GRADIENTS = [
  GRADIENTS.primaryGradient,
  GRADIENTS.secondaryGradient,
  GRADIENTS.accentGradient,
  GRADIENTS.successGradient,
  GRADIENTS.oceanGradient,
  GRADIENTS.purpleHazeGradient,
  GRADIENTS.sunsetGradient,
  GRADIENTS.forestGradient,
];

const QuickActionButton = memo(({action, onPress, index, isDarkMode}) => {
  const gradient = QUICK_ACTION_GRADIENTS[index % QUICK_ACTION_GRADIENTS.length];
  const iconName = QUICK_ACTION_ICONS[action.key] || 'apps';

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={() => onPress(action)}
      activeOpacity={0.7}>
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={styles.actionGradient}>
        <Icon name={iconName} size={24} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.actionLabel, isDarkMode && styles.actionLabelDark]}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );
});

const QuickActions = ({actions = [], onActionPress}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const [recentServices, setRecentServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayActions, setDisplayActions] = useState(actions);

  useEffect(() => {
    fetchRecentServices();
  }, []);

  useEffect(() => {
    if (actions.length > 0) {
      setDisplayActions(actions);
    } else if (recentServices.length > 0) {
      // Use recent services as quick actions if no actions provided
      const suggestedActions = recentServices.slice(0, 6).map((service, idx) => ({
        id: service.service_id || idx,
        label: service.service_name || 'Service',
        key: service.service_key || 'service',
        data: service,
      }));
      setDisplayActions(suggestedActions);
    }
  }, [actions, recentServices]);

  const fetchRecentServices = async () => {
    try {
      const token = await EncryptedStorage.getItem('cs_token');
      if (token) {
        const response = await axios.get(
          'https://backend.clicksolver.com/api/user/recent-services',
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );
        if (response.data && Array.isArray(response.data)) {
          setRecentServices(response.data);
        }
      }
    } catch (error) {
      console.log('Error fetching recent services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionPress = action => {
    if (onActionPress) {
      onActionPress(action);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (displayActions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {displayActions.map((action, index) => (
          <QuickActionButton
            key={action.id || index}
            action={action}
            onPress={handleActionPress}
            index={index}
            isDarkMode={isDarkMode}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    width: 70,
  },
  actionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionLabel: {
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Medium',
  },
  actionLabelDark: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(QuickActions);
