import React from 'react';
import {StyleSheet, View, Text, FlatList} from 'react-native';
import {useTranslation} from 'react-i18next';

/**
 * ServiceList Component
 * Displays list of services with pricing, including discount calculations
 */
const ServiceList = ({services, discount, isDarkMode}) => {
  const {t} = useTranslation();

  // Calculate total service cost
  const totalServiceCost = services.reduce(
    (sum, service) => sum + service.totalCost,
    0,
  );

  const renderServiceItem = ({item}) => {
    if (discount > 0) {
      // Allocate discount proportionally across services
      const allocatedDiscount = Math.round(
        (item.totalCost / totalServiceCost) * discount,
      );
      const finalCost = item.totalCost - allocatedDiscount;

      return (
        <View style={styles.serviceItem}>
          <Text
            style={[styles.serviceName, {color: isDarkMode ? '#fff' : '#212121'}]}
            numberOfLines={2}>
            {t(`singleService_${item.main_service_id}`) || item.serviceName}
          </Text>
          <Text style={[styles.cost, {color: isDarkMode ? '#fff' : '#212121'}]}>
            <Text style={styles.strikeThrough}>₹{item.totalCost}</Text> ₹
            {finalCost}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.serviceItem}>
          <Text
            style={[styles.serviceName, {color: isDarkMode ? '#fff' : '#212121'}]}
            numberOfLines={2}>
            {t(`singleService_${item.main_service_id}`) || item.serviceName}
          </Text>
          <Text style={[styles.cost, {color: isDarkMode ? '#fff' : '#212121'}]}>
            ₹{item.totalCost}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '77%',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  serviceName: {
    fontSize: 14,
    width: 90,
  },
  cost: {
    fontSize: 14,
  },
  strikeThrough: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
});

export default ServiceList;
