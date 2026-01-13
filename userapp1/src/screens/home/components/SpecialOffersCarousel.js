import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

const SpecialOffersCarousel = ({offers, isDarkMode, t}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollViewRef.current && offers.length > 1) {
        const nextIndex = (currentIndex + 1) % offers.length;
        scrollViewRef.current.scrollTo({
          x: nextIndex * (CARD_WIDTH + 15),
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, offers.length]);

  const handleScroll = event => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + 15));
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: isDarkMode ? '#FFFFFF' : '#1D2951'}]}>
        {t('special_offers') || 'Special Offers'}
      </Text>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 15}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {offers.map(offer => (
          <View key={offer.id} style={[styles.offerCard, {width: CARD_WIDTH}]}>
            <LinearGradient
              colors={[offer.backgroundcolor || '#FFF4E6', offer.backgroundcolor || '#FFE8D6']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.offerGradient}>
              {/* Offer Details */}
              <View style={styles.offerDetails}>
                <Text style={styles.discountText}>
                  {offer.discount_percentage}% OFF
                </Text>
                <Text
                  style={[styles.offerTitle, {color: isDarkMode ? '#333' : '#4a4a4a'}]}
                  numberOfLines={1}>
                  {offer.summary}
                </Text>
                <Text
                  style={[styles.offerDescription, {color: isDarkMode ? '#555' : '#6a6a6a'}]}
                  numberOfLines={2}>
                  {offer.description}
                </Text>
              </View>

              {/* Offer Image */}
              <Image
                source={{uri: offer.image}}
                style={styles.offerImage}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {offers.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  currentIndex === index
                    ? '#F24E1E'
                    : isDarkMode
                    ? '#555'
                    : '#D0D0D0',
                width: currentIndex === index ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    paddingLeft: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 15,
  },
  scrollContent: {
    paddingRight: 20,
    gap: 15,
  },
  offerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  offerGradient: {
    flexDirection: 'row',
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  offerDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  discountText: {
    fontSize: 36,
    fontFamily: 'RobotoSlab-Bold',
    color: '#F24E1E',
    lineHeight: 40,
  },
  offerTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-SemiBold',
    marginTop: 4,
  },
  offerDescription: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    marginTop: 4,
    lineHeight: 16,
  },
  offerImage: {
    width: 120,
    height: 120,
    alignSelf: 'flex-end',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
});

export default SpecialOffersCarousel;
