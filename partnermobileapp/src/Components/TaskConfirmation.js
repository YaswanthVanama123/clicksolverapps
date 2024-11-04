import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import EncryptedStorage from "react-native-encrypted-storage";

const TaskConfirmation = () => {
  const route = useRoute();
  const { encodedId } = route.params;
  const [decodedId, setDecodedId] = useState(null);
  const [details, setDetails] = useState({
    city: null,
    area: null,
    alternateName: null,
    alternatePhoneNumber: null,
    pincode: null,
    service: null,
  });

  const navigation = useNavigation();

  useEffect(() => {
    if (encodedId) {
      const decoded = atob(encodedId);
      setDecodedId(decoded);
    }
  }, [encodedId]);

  useEffect(() => {
    if (decodedId) {
      const fetchPaymentDetails = async () => {
        try {
          const response = await axios.post(`${process.env.BackendAPI5}/api/worker/details`, {
            notification_id: decodedId,
          });
          setDetails({
            city: response.data.city,
            area: response.data.area,
            pincode: response.data.pincode,
            alternateName: response.data.alternate_name,
            alternatePhoneNumber: response.data.alternate_phone_number,
            service: response.data.service_booked,
          });
        } catch (error) {
          console.error('Error fetching payment details:', error);
        }
      };
      fetchPaymentDetails();
    }
  }, [decodedId]);

  const handleComplete = async () => {
    const encoded = btoa(decodedId);
    try {
      const response = await axios.post(`${process.env.BackendAPI5}/api/worker/confirm/completed`, {
        notification_id: decodedId, 
        encodedId: encoded,
      });

      if (response.status === 200) {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        
        await axios.post(`${process.env.BackendAPI5}/api/worker/action`, {
          encodedId: encoded,
          screen: 'PaymentScreen',
        }, {
          headers: {
            Authorization: `Bearer ${pcs_token}`,
          },
        });

        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'PaymentScreen', params: { encodedId: encoded } }],
        }));
      } else {
        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
        }));
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handlePress = () => {
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.confirmationContainer}>
        <View style={styles.taskHeader}>
          <Text style={styles.headerText}>Task Completion Confirmation</Text>
          <Text style={styles.subHeaderText}>Please confirm if you have completed the assigned task.</Text>
        </View>
                <Text style={styles.taskText}>Task: {' '}
                    {details.service && details.service.length > 0
                      ? details.service.map(service => service.serviceName).join(', ')
                      : 'Switch board & Socket repairing'}
                  </Text>
        <Text style={styles.taskText}>Location: {details.area}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.completedButton]} onPress={handleComplete}>
            <Icon name="check-circle" size={16} color="#fff" />
            <Text style={styles.buttonText}>Yes, Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.notCompletedButton]} onPress={handlePress}>
            <Icon name="times-circle" size={16} color="#000" />
            <Text style={[styles.buttonText, styles.notCompletedText]}>No, Not Completed</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.responseText}>
          Your response has been recorded and will be reviewed by your supervisor.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 10,
    width: '90%',
  },
  taskHeader: {
    marginBottom: 30,
  },
  headerText: {
    fontSize: 25,
    marginBottom: 10,
    color: '#333',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
  },
  taskText: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38%',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  completedButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  notCompletedButton: {
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  notCompletedText: {
    color: '#000',
  },
  responseText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default TaskConfirmation;
