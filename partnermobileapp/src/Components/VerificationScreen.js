import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';

const VerificationScreen = () => {
  const [timer, setTimer] = useState(120); // 2 minutes timer
  const [code, setCode] = useState(['', '', '', '']);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleCodeChange = (index, value) => {
    let newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  };

  const formattedTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* A parent View to hold the absolute background image and the content */}
      <View style={{flex: 1}}>
        {/* Absolutely positioned background image */}
        <Image
          source={{
            uri: 'https://i.postimg.cc/zB1C8frj/Picsart-24-10-01-15-26-57-512-1.jpg',
          }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="stretch"
        />

        {/* Foreground content */}
        <View style={styles.container}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.instruction}>
            Please enter the 4-digit code sent on
          </Text>
          <Text style={styles.number}>+91 9392365494</Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                style={styles.codeInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={value => handleCodeChange(index, value)}
              />
            ))}
          </View>

          <Text style={styles.timer}>{formattedTime()}</Text>

          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>

          <View style={styles.contactContainer}>
            <Text style={styles.contactText}>Contact us:</Text>
            <View style={styles.socialIcons}>
              <Entypo name="mail" size={15} color="#9e9e9e" />
              <Entypo name="facebook" size={15} color="#9e9e9e" />
              <Entypo name="instagram" size={15} color="#9e9e9e" />
            </View>
            <Text style={styles.email}>Clicksolver@yahoo.com</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#212121',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9e9e9e',
  },
  number: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#212121',
    fontWeight: 'bold',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
    marginBottom: 20,
    gap: 10,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    width: 45,
    height: 45,
    textAlign: 'center',
    fontSize: 18,
    color: '#212121',
  },
  timer: {
    fontSize: 18,
    fontWeight: '800', // ensure it's a valid fontWeight
    marginBottom: 20,
    color: '#212121',
  },
  submitButton: {
    backgroundColor: '#ff6c37',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 40,
    width: 150,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactContainer: {
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    marginBottom: 10,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 10,
  },
  email: {
    fontSize: 12,
    color: '#9e9e9e',
    paddingBottom: 30,
  },
});

export default VerificationScreen;
