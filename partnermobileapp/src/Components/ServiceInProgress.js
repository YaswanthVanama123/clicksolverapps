import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RadioButton} from 'react-native-paper';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import {useRoute, useNavigation} from '@react-navigation/native';

const ServiceInProgressScreen = () => {
  // Define statuses and display names
  const statuses = ['In Progress', 'Work started', 'Work Completed'];
  const statusKeys = ['accept', 'arrived', 'workCompleted'];
  const statusDisplayNames = {
    accept: 'In Progress',
    arrived: 'Work started',
    workCompleted: 'Work Completed',
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const {
          data: {data, paymentDetails},
        } = await axios.post(
          `${process.env.BackendAPI6}/api/user/work/progress/details`,
          {tracking_id},
        );
        setDetails(data);
        setPaymentDetails(paymentDetails);
        setServiceArray(data.service_booked);
      } catch (error) {
        console.error('Error fetching bookings data:', error);
      }
    };
    fetchBookings();
  }, []);

  // Initial services with statuses
  const initialServices = [
    {
      id: 1,
      name: 'Ac Repair',
      quantity: 1,
      image: 'https://i.postimg.cc/6Tsbn3S6/Image-8.png',
      status: {
        accept: '9:00 AM',
        arrived: null,
        workCompleted: null,
      },
    },
    {
      id: 2,
      name: 'Plumbing',
      quantity: 2,
      image: 'https://i.postimg.cc/6Tsbn3S6/Image-8.png',
      status: {
        accept: '10:00 AM',
        arrived: '11:00 AM',
        workCompleted: null,
      },
    },
    {
      id: 3,
      name: 'Electrical',
      quantity: 1,
      image: 'https://i.postimg.cc/6Tsbn3S6/Image-8.png',
      status: {
        accept: '8:30 AM',
        arrived: '9:15 AM',
        workCompleted: '12:00 PM',
      },
    },
  ];

  // State to manage the list of services
  const [services, setServices] = useState(initialServices);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingSelectedStatus, setEditingSelectedStatus] = useState('');

  // Function to generate timeline data
  const generateTimelineData = status => {
    return statusKeys.map(statusKey => ({
      key: statusKey,
      title: statusDisplayNames[statusKey],
      time: status[statusKey] || null,
      iconColor: status[statusKey] ? '#ff4500' : '#a1a1a1',
      lineColor: status[statusKey] ? '#ff4500' : '#a1a1a1',
      isSelectable: !status[statusKey],
    }));
  };

  // Function to get current status as a string
  const getCurrentStatus = status => {
    for (let i = statusKeys.length - 1; i >= 0; i--) {
      if (status[statusKeys[i]]) {
        return statusKeys[i];
      }
    }
    return 'pending';
  };

  // Function to handle service completion
  const handleServiceCompletion = () => {
    // Update the status of all services to 'workCompleted'
    setServices(prevServices =>
      prevServices.map(service => {
        const updatedStatus = {...service.status};
        const currentTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        updatedStatus.workCompleted = currentTime;
        return {...service, status: updatedStatus};
      }),
    );

    Alert.alert(
      'Service Completed',
      'You have marked the service as workCompleted.',
    );
    // Navigate to another screen if needed
    // navigation.navigate('SomeOtherScreen');
  };

  // Function to handle Edit button press
  const handleEditPress = serviceId => {
    if (editingServiceId === serviceId) {
      // If already editing, cancel editing
      setEditingServiceId(null);
    } else {
      // Start editing the selected service
      setEditingServiceId(serviceId);
    }
  };

  // Function to handle status change with confirmation
  const handleStatusChange = (serviceId, statusKey) => {
    const statusName = statusDisplayNames[statusKey];
    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to change the status to "${statusName}"?`,
      [
        {
          text: 'No',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => applyStatusChange(serviceId, statusKey),
        },
      ],
    );
  };

  // Function to apply the status change
  const applyStatusChange = (serviceId, statusKey) => {
    const selectedStatusIndex = statusKeys.indexOf(statusKey);
    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Update the status based on selected value
    setServices(prevServices =>
      prevServices.map(service => {
        if (service.id === serviceId) {
          const updatedStatus = {...service.status};
          for (let i = 0; i <= selectedStatusIndex; i++) {
            const key = statusKeys[i];
            if (!updatedStatus[key]) {
              updatedStatus[key] = currentTime;
            }
          }
          return {...service, status: updatedStatus};
        }
        return service;
      }),
    );

    // Exit editing mode
    setEditingServiceId(null);
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <FontAwesome6
          name="arrow-left-long"
          size={20}
          color="#212121"
          style={styles.leftIcon}
        />
        <Text style={styles.headerText}>Service In Progress</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Service Details */}
        <View style={styles.serviceDetailsContainer}>
          <View style={styles.serviceDetailsHeaderContainer}>
            <Text style={styles.serviceDetailsTitle}>Service Details</Text>
            <TouchableOpacity>
              <Icon name="keyboard-arrow-right" size={24} color="#ff4500" />
            </TouchableOpacity>
          </View>
          <View style={styles.iconDetailsContainer}>
            <View style={styles.detailsRow}>
              <Icon name="calendar-today" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                Work started{' '}
                <Text style={styles.highLightText}>24th Oct 2023 9:00 PM</Text>
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Icon name="location-on" size={20} color="#ff4500" />
              <Text style={styles.detailText}>
                Location:{' '}
                <Text style={styles.highLightText}>123 Main Street, City</Text>
              </Text>
            </View>
          </View>
          <View>
            <View style={{marginTop: 20}}>
              {services.map(service => {
                const timelineData = useMemo(
                  () => generateTimelineData(service.status),
                  [service.status],
                );

                const currentStatus = getCurrentStatus(service.status);

                return (
                  <View style={styles.ServiceCardsContainer} key={service.id}>
                    <View style={styles.technicianContainer}>
                      <Image
                        source={{uri: service.image}}
                        style={styles.technicianImage}
                      />
                      <View style={styles.technicianDetails}>
                        <Text style={styles.technicianName}>
                          {service.name}
                        </Text>
                        <Text style={styles.technicianTitle}>
                          Quantity : {service.quantity}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.statusText}>
                      Service Status:{' '}
                      <Text style={styles.highLightText}>
                        {statusDisplayNames[currentStatus] || 'Pending'}
                      </Text>
                    </Text>
                    <Text style={styles.statusText}>
                      Estimated Completion:{' '}
                      <Text style={styles.highLightText}>2 hours</Text>
                    </Text>

                    {/* Timeline Section */}
                    <View style={styles.sectionContainer}>
                      <View style={styles.serviceTimeLineContainer}>
                        <Text style={styles.sectionTitle}>
                          Service Timeline
                        </Text>
                        {currentStatus !== 'workCompleted' && (
                          <TouchableOpacity
                            onPress={() => handleEditPress(service.id)}>
                            <Text style={styles.editText}>
                              {editingServiceId === service.id
                                ? 'Cancel'
                                : 'Edit'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={styles.innerContainerLine}>
                        {timelineData.map((item, index) => (
                          <View key={item.key} style={styles.timelineItem}>
                            <View style={styles.iconAndLineContainer}>
                              <MaterialCommunityIcons
                                name="circle"
                                size={14}
                                color={item.iconColor}
                              />
                              {index !== timelineData.length - 1 && (
                                <View
                                  style={[
                                    styles.lineSegment,
                                    {
                                      backgroundColor:
                                        timelineData[index + 1].iconColor,
                                    },
                                  ]}
                                />
                              )}
                            </View>
                            <View style={styles.timelineContent}>
                              <View style={styles.timelineTextContainer}>
                                <Text style={styles.timelineText}>
                                  {item.title}
                                </Text>
                                <Text style={styles.timelineTime}>
                                  {item.time ? item.time : 'Pending'}
                                </Text>
                              </View>
                              {editingServiceId === service.id &&
                                !item.time && (
                                  <RadioButton
                                    value={item.key}
                                    status={
                                      editingSelectedStatus === item.key
                                        ? 'checked'
                                        : 'unchecked'
                                    }
                                    onPress={() => {
                                      setEditingSelectedStatus(item.key);
                                      handleStatusChange(service.id, item.key);
                                    }}
                                    color="#ff4500"
                                  />
                                )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Service Completed Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleServiceCompletion}>
            <Text style={styles.buttonText}>Service Completed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  serviceDetailsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceDetailsTitle: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 17,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 1,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
    zIndex: 1, // Ensure header is above other components
  },
  leftIcon: {
    position: 'absolute',
    top: 15,
    left: 10,
  },
  headerText: {
    color: '#212121',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    width: '95%',
    marginTop: 10,
  },
  serviceTimeLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  editText: {
    color: '#ff5700',
    fontSize: 15,
    fontWeight: '500',
  },
  innerContainerLine: {
    marginTop: 5,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconAndLineContainer: {
    alignItems: 'center',
    width: 20,
  },
  lineSegment: {
    width: 2,
    height: 35,
    marginTop: 2,
  },
  timelineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  timelineTextContainer: {
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
  },
  timelineTime: {
    fontSize: 10,
    color: '#4a4a4a',
  },
  button: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceDetailsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 10,
    color: '#4a4a4a',
    fontSize: 14,
  },
  highLightText: {
    fontWeight: 'bold',
    color: '#212121',
  },
  ServiceCardsContainer: {
    flexDirection: 'column',
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  technicianContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  technicianImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  technicianDetails: {
    marginLeft: 15,
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  technicianTitle: {
    color: '#4a4a4a',
    fontSize: 14,
  },
  statusText: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 5,
  },
});

export default ServiceInProgressScreen;
