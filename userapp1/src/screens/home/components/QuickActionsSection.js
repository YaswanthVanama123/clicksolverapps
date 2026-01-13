import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const QuickActionsSection = ({services, onActionPress, isDarkMode, t}) => {
  const getIconForService = serviceName => {
    const iconMap = {
      Electrician: 'flash',
      Plumber: 'water',
      Cleaning: 'brush',
      Painter: 'color-palette',
      Mechanic: 'construct',
      Carpenter: 'hammer',
      'AC Service': 'snow',
      Appliance: 'tv',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (serviceName?.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return 'cube';
  };

  const gradientColors = [
    ['#FF6B35', '#F24E1E'],
    ['#4CAF50', '#2E7D32'],
    ['#2196F3', '#1565C0'],
    ['#9C27B0', '#6A1B9A'],
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: isDarkMode ? '#FFFFFF' : '#1D2951'}]}>
        {t('quick_actions') || 'Quick Actions'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={service.service_id}
            onPress={() => onActionPress(service.service_id, service.service_name)}
            activeOpacity={0.8}
            style={styles.actionButton}>
            <LinearGradient
              colors={gradientColors[index % gradientColors.length]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.actionGradient}>
              <Icon
                name={getIconForService(service.service_name)}
                size={28}
                color="#FFFFFF"
              />
            </LinearGradient>
            <Text
              style={[styles.actionText, {color: isDarkMode ? '#E0E0E0' : '#333333'}]}
              numberOfLines={1}>
              {t(`service_${service.service_id}`) || service.service_name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    paddingLeft: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 15,
  },
  scrollContent: {
    paddingRight: 20,
    gap: 15,
  },
  actionButton: {
    alignItems: 'center',
    width: 80,
  },
  actionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Medium',
    textAlign: 'center',
  },
});

export default QuickActionsSection;
