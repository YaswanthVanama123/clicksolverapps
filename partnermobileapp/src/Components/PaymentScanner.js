import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import {RadioButton} from 'react-native-paper';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import SwipeButton from 'rn-swipe-button';
import Entypo from 'react-native-vector-icons/Entypo';

const PaymentScanner = ({route}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDetails, setPaymentDetails] = useState({});
  const [decodedId, setDecodedId] = useState(null);
  const [encodedId, setEncodedId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [titleColor, setTitleColor] = useState('#FF5722');
  const [swiped, setSwiped] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const {encodedId} = route.params;
    if (encodedId) {
      setEncodedId(encodedId);
      const decoded = atob(encodedId);
      setDecodedId(decoded);
    }
  }, [route.params]);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (decodedId) {
        try {
          const response = await axios.post(
            `http://192.168.55.101:5000/api/worker/payment/scanner/details`,
            {
              notification_id: decodedId,
            },
          );

          console.log(response.data);

          const {totalAmount: amount, name, service} = response.data;
          setPaymentDetails({name, service});
          setTotalAmount(Number(amount) || 0);
        } catch (error) {
          console.error('Error fetching payment details:', error);
        }
      }
    };
    fetchPaymentDetails();
  }, [decodedId]);

  const onBackPress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
      }),
    );
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => onBackPress();
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [navigation]),
  );

  const handlePayment = async () => {
    try {
      const pcs_token = await EncryptedStorage.getItem('pcs_token');
      const numberAmmount = Number(totalAmount);
      console.log('sended data', numberAmmount, paymentMethod, decodedId);
      await axios.post(`http://192.168.55.101:5000/api/user/payed`, {
        totalAmount: numberAmmount,
        paymentMethod,
        decodedId,
      });

      await axios.post( 
        `http://192.168.55.101:5000/api/worker/action`,
        {
          encodedId,
          screen: '',
        },
        {
          headers: {
            Authorization: `Bearer ${pcs_token}`,
          },
        },
      );

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'ServiceCompleted', params: {encodedId}}],
        }),
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment.');
    }
  };

  const ThumbIcon = () => (
    <View style={styles.thumbContainer}>
      <Text>
        {swiped ? (
          <Entypo
            name="check"
            size={20}
            color="#ffffff"
            style={styles.checkIcon}
          />
        ) : (
          <FontAwesome6 name="arrow-right-long" size={18} color="#ffffff" />
        )}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.leftIcon} onPress={onBackPress}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#9e9e9e" />
        </TouchableOpacity>
        <Text style={styles.screenName}>Payment Scanner</Text>
      </View>

      <View style={styles.profileContainer}>
        <Image
          source={{
            uri: 'https://i.postimg.cc/L5drkdQq/Image-2-removebg-preview.png',
          }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{paymentDetails.name}</Text>
        <Text style={styles.amountText}>Amount</Text>
        <Text style={styles.amount}>₹{totalAmount}</Text>
        <Text style={styles.service}>{paymentDetails.service}</Text>

        <View style={styles.qrContainer}>
          <Image
            source={{uri: 'https://i.postimg.cc/3RDzkGDh/Image-3.png'}}
            style={styles.ScannerImage}
          />
          <Text style={styles.qrText}>Scan QR code to pay</Text>
        </View>
      </View>

      <View style={styles.radioContainer}>
        <RadioButton
          value="cash"
          status={paymentMethod === 'cash' ? 'checked' : 'unchecked'}
          onPress={() => setPaymentMethod('cash')}
        />
        <Text style={styles.radioText}>Paid by Cash</Text>
      </View>

      <View>
        <SwipeButton
          title="Collected Amount"
          titleStyles={{color: titleColor, fontSize: 16}}
          railBackgroundColor="#ffffff"
          railBorderColor="#FF5722"
          railStyles={{
            borderRadius: 25,
            height: 50,
            backgroundColor: '#FF450000',
            borderColor: '#FF450000',
          }}
          thumbIconComponent={ThumbIcon}
          thumbIconBackgroundColor="#FF5722"
          thumbIconBorderColor="#FFFFFF"
          thumbIconWidth={50}
          thumbIconHeight={50}
          onSwipeStart={() => setTitleColor('#802300')}
          onSwipeSuccess={() => {
            handlePayment();
            setTitleColor('#FF5722');
            setSwiped(true);
          }}
          onSwipeFail={() => setTitleColor('#FF5722')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  thumbContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
  },
  screenName: {
    color: '#747476',
    fontSize: 17,
    fontWeight: 'bold',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F3F6F8',
    borderRadius: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  amountText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 10,
  },
  amount: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 10,
  },
  service: {
    fontSize: 16,
    color: '#212121',
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrText: {
    marginTop: 10,
    fontSize: 14,
    color: '#212121',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  radioText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#212121',
    fontWeight: 'bold',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    position: 'relative',
    marginBottom: 20,
  },
  ScannerImage: {
    width: 150,
    height: 150,
    marginTop: 20,
  },
});

export default PaymentScanner;
