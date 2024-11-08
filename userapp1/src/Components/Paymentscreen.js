import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, BackHandler, Linking } from "react-native";
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import axios from "axios";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Payment = ({ route }) => {
    const [paymentMethod, setPaymentMethod] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [totalAmount, setTotalAmount] = useState(0);
    const [gstAmount, setGstAmount] = useState(0);
    const [cgstAmount, setCgstAmount] = useState(0);
    const [cashback, setCashback] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [paymentDetails, setPaymentDetails] = useState({});
    const navigation = useNavigation();
    const [serviceArray, setServiceArray] = useState([]);
    const { encodedId } = route.params;

    useEffect(() => {
        if (encodedId) {
            const decoded = atob(encodedId);
            fetchPaymentDetails(decoded);
        }
    }, [encodedId]);

    const fetchPaymentDetails = useCallback(async (decodedId) => {
        try {
            const response = await axios.post(`${process.env.BACKENDAIPE}/api/payment/details`, {
                notification_id: decodedId,
            });
            const { start_time, end_time, time_worked, service_booked, name, area, city, pincode, gstAmount, cgstAmount, discountAmount, fetchedFinalTotalAmount } = response.data;

            const startTime = formatTime(start_time);
            const endTime = formatTime(end_time);
            const timeWorked = convertTimeStringToReadableFormat(time_worked);
            const completedTime = convertISODateToReadableFormat(end_time);

            setPaymentDetails({
                start_time: startTime,
                end_time: endTime,
                time_worked: timeWorked,
                completedTime,
                city,
                area,
                pincode,
                name
            });
            setGstAmount(gstAmount);
            setCgstAmount(cgstAmount);
            setCashback(discountAmount);
            setGrandTotal(fetchedFinalTotalAmount);
            setServiceArray(service_booked);
        } catch (error) {
            console.error('Error fetching payment details:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
                    })
                );
                return true;
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => backHandler.remove();
        }, [navigation])
    );

    const formatTime = useCallback((dateTime) => {
        return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const convertTimeStringToReadableFormat = useCallback((timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        let result = '';
        if (hours > 0) {
            result += `${hours}h `;
        }
        if (minutes > 0) {
            result += `${minutes}m`;
        }
        return result.trim() || '0m';
    }, []);

    const convertISODateToReadableFormat = useCallback((isoDateString) => {
        const date = new Date(isoDateString);
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }, []);

    const applyCoupon = () => {
        if (couponCode === 'DISCOUNT10') {
            setGrandTotal((prevTotal) => Math.max(prevTotal - 10, 0));
        }
    };

    const openPhonePeScanner = useCallback(() => {
        const url = 'phonepe://scan';
        Linking.openURL(url)
            .then(() => {
                console.log('PhonePe scanner opened successfully');
            })
            .catch((err) => {
                console.error('Failed to open PhonePe scanner:', err);
                Linking.openURL('https://play.google.com/store/apps/details?id=com.phonepe.app');
            });
    }, []);

    const handlePayment = useCallback(async () => {
        try {
            const cs_token = await EncryptedStorage.getItem('cs_token');
            await axios.post(`${process.env.BACKENDAIPE}/api/user/payed`, {
                totalAmount: grandTotal,
                paymentMethod,
                notification_id: atob(encodedId),
            }, {
                headers: {
                    Authorization: `Bearer ${cs_token}`,
                },
            });

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Rating', params: { encodedId } }],
                })
            );
        } catch (error) {
            console.error('Error processing payment:', error);
            Alert.alert("Error", "Failed to process payment.");
        }
    }, [encodedId, grandTotal, paymentMethod, navigation]);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.serviceId}>Service #1293087879</Text>
                    <Text style={styles.duration}>Duration, {paymentDetails.time_worked}</Text>
                </View>
                <TouchableOpacity>
                    <Text style={styles.helpText}>HELP</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.locationContainer}>
                <Icon name="map-marker" size={24} color="#4a4a4a" />
                <View style={{ marginLeft: 8 }}>
                    <Text style={styles.locationTitle}>{paymentDetails.area}</Text>
                    
                </View>
            </View>

            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{paymentDetails.start_time}</Text>
                <View style={styles.dottedLine} />
                <Text style={styles.timeText}>{paymentDetails.end_time}</Text>
                <View style={styles.horizantalLine} />
            </View>

            <View style={styles.completionContainer}>
                <Icon name="check-circle-outline" size={20} color="#2DA44E" />
                <Text style={styles.completionText}>
                    Service completed on {paymentDetails.completedTime}, {paymentDetails.end_time} by {paymentDetails.name}
                </Text>
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>DETAILS</Text>
            </View>
            <View style={styles.paymentDetails}>
                {serviceArray.map((service) => (
                    <View style={styles.breakdownContainer} key={service.id}>
                        <Text style={styles.breakdownItem}>
                            {typeof service.serviceName === 'string' ? service.serviceName : 'Service Name Unavailable'}
                        </Text>
                        <Text style={styles.breakdownPrice}>
                            {typeof service.cost === 'number' ? `₹${service.cost.toFixed(2)}` : 'Cost Unavailable'}
                        </Text>
                    </View>
                ))}

                <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownItem}>GST (5%)</Text>
                    <Text style={styles.breakdownPrice}>₹{gstAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownItem}>CGST (5%)</Text>
                    <Text style={styles.breakdownPrice}>₹{cgstAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownItem}>Cashback</Text>
                    <Text style={styles.breakdownPrice}>-₹{cashback.toFixed(2)}</Text>
                </View>

                <View style={styles.horizantalLastLine} />
            </View>

            <View style={styles.paymentMethod}>
                <View style={styles.serviceRow}>
                    <Icon name="line-scan" size={20} color="#4F4F4F" />
                    <Text style={styles.paymentText}>Paid Via Scan</Text>
                </View>
                <Text style={styles.grandTotal}>Grand Total ₹{grandTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.noticeContainer}>
                <Icon name="information-outline" size={16} color="#6E6E6E" />
                <Text style={styles.noticeText}>
                    Spare parts are not included in this payment
                </Text>
            </View>

            <TouchableOpacity style={styles.payButton} onPress={openPhonePeScanner}>
                <Text style={styles.payButtonText}>PAY</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: { elevation: 1 },
        }),
    },
    serviceId: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#212121',
    },
    duration: {
        color: '#4a4a4a',
    },
    helpText: {
        color: '#ff4500',
        fontWeight: '400',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width:'95%',
        padding: 16,
    },
    locationTitle: {
        fontWeight: '400',
        fontSize: 12,
        color: '#4a4a4a',
    },
    locationSubText: {
        color: '#6E6E6E',
    },
    timeContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    timeText: {
        fontSize: 16,
        color: '#4a4a4a',
    },
    dottedLine: {
        height: 20,
        borderLeftWidth: 1,
        borderColor: '#6E6E6E',
        marginVertical: 4,
    },
    horizantalLine: {
        height: 1,
        backgroundColor: '#9e9e9e',
        marginVertical: 10,
    },
    completionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 10
    },
    completionText: {
        marginLeft: 8,
        color: '#4a4a4a',
    },
    detailsContainer: {
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    paymentDetails: {
        padding: 16,
    },
    detailsTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#4a4a4a',
    },
    breakdownContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    breakdownItem: {
        color: '#6E6E6E',
    },
    breakdownPrice: {
        fontWeight: 'bold',
        color: '#212121',
    },
    horizantalLastLine: {
        height: 1,
        backgroundColor: '#9e9e9e',
    },
    paymentMethod: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    serviceRow:{
        flexDirection:'row',
        alignItems:'center'
    },
    paymentText: {
        marginLeft: 8,
        color: '#6E6E6E',
    },
    grandTotal: {
        fontWeight: 'bold',
        color: '#212121',
    },
    noticeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    noticeText: {
        marginLeft: 8,
        color: '#6E6E6E',
    },
    payButton: {
        backgroundColor: '#ff4500',
        margin: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    payButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default Payment;
