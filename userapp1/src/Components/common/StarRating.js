import React from 'react';
import {View} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

/**
 * StarRating Component
 * Renders fractional stars up to 5 stars
 * @param {number} rating - Rating value (0-5)
 * @param {number} starSize - Size of each star (default: 16)
 * @param {boolean} isDarkMode - Dark mode flag for colors
 */
const StarRating = ({rating = 0, starSize = 16, isDarkMode = false}) => {
  const totalStars = 5;
  const stars = [];

  for (let i = 1; i <= totalStars; i++) {
    let fraction = rating - (i - 1);
    if (fraction < 0) fraction = 0;
    if (fraction > 1) fraction = 1;

    stars.push(
      <View
        key={i}
        style={{
          width: starSize,
          height: starSize,
          marginRight: 4,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}>
        {/* Gray star behind */}
        <AntDesign
          name="star"
          size={starSize}
          color={isDarkMode ? '#555' : '#ccc'}
          style={{position: 'absolute', left: 0, top: 0}}
        />
        {/* Colored star in front */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: starSize * fraction,
            overflow: 'hidden',
            height: starSize,
          }}>
          <AntDesign name="star" size={starSize} color="#FF5722" />
        </View>
      </View>,
    );
  }

  return <View style={{flexDirection: 'row'}}>{stars}</View>;
};

export default StarRating;
