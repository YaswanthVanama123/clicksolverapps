import React from 'react';
import {View, Text, StyleSheet, Image, ActivityIndicator} from 'react-native';
import LottieView from 'lottie-react-native';
import ServiceCard from './ServiceCard';

const ServiceGrid = ({services, loading, onServicePress, isDarkMode, t}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/cardsLoading.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, {color: isDarkMode ? '#B0B0B0' : '#757575'}]}>
          {t('no_services_available') || 'No services available'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: isDarkMode ? '#FFFFFF' : '#1D2951'}]}>
        {t('services') || 'Services'}
      </Text>
      <View style={styles.grid}>
        {services.map(service => (
          <ServiceCard
            key={service.service_id}
            service={service}
            onPress={() => onServicePress(service.service_id, service.service_name)}
            isDarkMode={isDarkMode}
            t={t}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  title: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 15,
  },
  grid: {
    gap: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingAnimation: {
    width: 150,
    height: 150,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
  },
});

export default ServiceGrid;
