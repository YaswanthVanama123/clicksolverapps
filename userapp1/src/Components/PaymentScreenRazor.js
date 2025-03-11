import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";

const PaymentScreenRazor = () => {
  const [amount, setAmount] = useState("");

  const startPayment = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    try {
      // Step 1: Create Order
      const response = await fetch("http:192.168.243.71:5000/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), currency: "INR" }),
      });

      const data = await response.json();
      if (!data.success) throw new Error("Order creation failed!");

      // Step 2: Open Razorpay Checkout
      const options = {
        description: "Click Solver Payment",
        image: "https://your-logo-url.png",
        currency: data.currency,
        key: "rzp_test_vca9xUL1SxWrEM", // Replace with your Razorpay Test Key
        amount: data.amount,
        name: "Click Solver",
        order_id: data.order_id,
        prefill: {
          email: "customer@example.com",
          contact: "9876543210",
          name: "Customer Name",
        },
        theme: { color: "#FF4500" },
      };

      RazorpayCheckout.open(options)
        .then(async (paymentData) => {
          // Step 3: Verify Payment
          const verifyResponse = await fetch("http:192.168.243.71:5000/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData),
          });

          const verifyData = await verifyResponse.json();
          Alert.alert("Payment Status", verifyData.message);
        })
        .catch((error) => {
          Alert.alert("Payment Failed", error.description);
        });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#212121" }}>Enter Amount</Text>
      
      <TextInput
        style={{
          width: "80%",
          height: 50,
          borderWidth: 1,
          borderColor: "#4a4a4a",
          borderRadius: 10,
          paddingHorizontal: 15,
          fontSize: 18,
          marginBottom: 20,
          textAlign: "center",
          backgroundColor: "#f5f5f5",
        }}
        placeholder="₹ Enter Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity
        style={{
          backgroundColor: "#FF4500",
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 10,
          elevation: 3,
        }}
        onPress={startPayment}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ffffff" }}>Pay Now</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentScreenRazor;
