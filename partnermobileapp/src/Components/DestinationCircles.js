import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const DestinationCircles = ({ complete }) => {
  const totalDestinations = 6;
  const activeColor = '#FF5722'; // Color for completed destinations
  const defaultColor = '#212121'; // Default color for destinations

  // Get the device width
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate the circle size and spacing dynamically
  const circleSize = screenWidth / (totalDestinations * 2.5); // Adjust the divisor to fine-tune the size
  const lineWidth = screenWidth / (totalDestinations * 2.5); // Adjust spacing for lines

  const renderCircles = () => {
    let circles = [];
    for (let i = 1; i <= totalDestinations; i++) {
      // Determine the color for the circle and line
      const circleColor = i <= complete ? activeColor : defaultColor;
      const lineColor = i < complete ? activeColor : defaultColor;

      circles.push(
        <View style={styles.circleContainer} key={i}>
          {/* Circle */}
          <View style={[styles.circle, { borderColor: circleColor, width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
            <Text style={[styles.circleText, { color: circleColor, fontSize: circleSize / 2.5 }]}>{i}</Text>
          </View>
          {/* Line (Only show if not the last circle) */}
          {i < totalDestinations && <View style={[styles.line, { width: lineWidth, backgroundColor: lineColor }]} />}
        </View>
      );
    }
    return circles;
  };

  return <View style={styles.container}>{renderCircles()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,

  },
  circleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontWeight: 'bold',
  },
  line: {
    height: 2,
  },
});

export default DestinationCircles;
