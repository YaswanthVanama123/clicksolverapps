import React, {memo, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../../context/ThemeContext';
import {GRADIENTS} from '../../../theme/gradients';
import {getColors} from '../../../theme/colors';

const OfferCard = memo(({offer, onPress, isDarkMode, index}) => {
  const gradients = [
    GRADIENTS.sunsetGradient,
    GRADIENTS.oceanGradient,
    GRADIENTS.forestGradient,
    GRADIENTS.purpleHazeGradient,
    GRADIENTS.primaryGradient,
    GRADIENTS.secondaryGradient,
  ];

  const gradient = gradients[index % gradients.length];

  return (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={() => onPress(offer)}
      activeOpacity={0.9}>
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={styles.offerGradient}>
        <View style={styles.offerContent}>
          {/* Left side - Text content */}
          <View style={styles.offerTextContainer}>
            {offer.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{offer.badge}</Text>
              </View>
            )}
            <Text style={styles.offerTitle} numberOfLines={2}>
              {offer.title}
            </Text>
            <Text style={styles.offerDescription} numberOfLines={3}>
              {offer.description}
            </Text>
            {offer.discount && (
              <View style={styles.discountTag}>
                <Text style={styles.discountText}>{offer.discount}</Text>
              </View>
            )}
          </View>

          {/* Right side - Image */}
          {offer.imageUrl && (
            <Image
              source={{uri: offer.imageUrl}}
              style={styles.offerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const OffersCarousel = ({offers = [], onOfferPress}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollTimer = useRef(null);

  const CARD_WIDTH = width - 40;
  const CARD_PADDING = 8;

  useEffect(() => {
    if (offers.length > 1) {
      startAutoScroll();
    }
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [offers.length, currentIndex]);

  const startAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }

    autoScrollTimer.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % offers.length;
      scrollToIndex(nextIndex);
    }, 3000);
  };

  const scrollToIndex = index => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (CARD_WIDTH + CARD_PADDING * 2),
        animated: true,
      });
      setCurrentIndex(index);
    }
  };

  const handleScroll = event => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_PADDING * 2));
    if (index !== currentIndex && index >= 0 && index < offers.length) {
      setCurrentIndex(index);
    }
  };

  const handleOfferPress = offer => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
    if (onOfferPress) {
      onOfferPress(offer);
    }
    // Restart auto-scroll after 5 seconds
    setTimeout(() => {
      if (offers.length > 1) {
        startAutoScroll();
      }
    }, 5000);
  };

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_PADDING * 2}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}>
        {offers.map((offer, index) => (
          <View key={offer.id || index} style={{padding: CARD_PADDING}}>
            <OfferCard
              offer={offer}
              onPress={handleOfferPress}
              isDarkMode={isDarkMode}
              index={index}
            />
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {offers.length > 1 && (
        <View style={styles.indicatorContainer}>
          {offers.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.8}>
              <View
                style={[
                  styles.indicator,
                  currentIndex === index && styles.indicatorActive,
                  {
                    backgroundColor:
                      currentIndex === index
                        ? colors.primary
                        : isDarkMode
                        ? '#555'
                        : '#D1D5DB',
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  offerCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  offerGradient: {
    flex: 1,
    padding: 20,
  },
  offerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FF6B35',
    textTransform: 'uppercase',
  },
  offerTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  offerDescription: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Regular',
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  discountTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  discountText: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
  },
  offerImage: {
    width: 100,
    height: 100,
    opacity: 0.9,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    width: 24,
    height: 8,
  },
});

export default memo(OffersCarousel);
