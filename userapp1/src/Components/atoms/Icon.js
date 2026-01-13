/**
 * Icon Component
 * A versatile icon wrapper with support for gradients and multiple icon libraries
 *
 * @component
 * @example
 * <Icon
 *   name="check"
 *   library="MaterialCommunityIcons"
 *   size={24}
 *   color="#FF6B35"
 * />
 */

import React, {memo} from 'react';
import {View, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';

/**
 * @typedef {'MaterialCommunityIcons' | 'MaterialIcons' | 'FontAwesome' | 'FontAwesome5' | 'Ionicons' | 'Feather' | 'AntDesign'} IconLibrary
 */

const iconLibraries = {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
  Ionicons,
  Feather,
  AntDesign,
};

/**
 * @param {Object} props - Component props
 * @param {string} props.name - Icon name
 * @param {IconLibrary} [props.library='MaterialCommunityIcons'] - Icon library
 * @param {number} [props.size=24] - Icon size
 * @param {string} [props.color] - Icon color
 * @param {string} [props.gradient] - Gradient name for gradient icon
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {object} [props.style] - Additional styles
 */
const Icon = ({
  name,
  library = 'MaterialCommunityIcons',
  size = 24,
  color,
  gradient,
  isDarkMode = false,
  style,
  ...props
}) => {
  const colors = getColors(isDarkMode);
  const IconComponent = iconLibraries[library] || MaterialCommunityIcons;
  const iconColor = color || colors.text.primary;

  // Render gradient icon using MaskedView
  if (gradient && GRADIENTS[gradient]) {
    const gradientConfig = GRADIENTS[gradient];

    return (
      <MaskedView
        maskElement={
          <View style={styles.maskWrapper}>
            <IconComponent name={name} size={size} color="#FFFFFF" {...props} />
          </View>
        }
        style={[{width: size, height: size}, style]}>
        <LinearGradient
          colors={gradientConfig.colors}
          start={gradientConfig.start}
          end={gradientConfig.end}
          style={{flex: 1}}
        />
      </MaskedView>
    );
  }

  // Render regular icon
  return (
    <IconComponent
      name={name}
      size={size}
      color={iconColor}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  maskWrapper: {
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(Icon);
