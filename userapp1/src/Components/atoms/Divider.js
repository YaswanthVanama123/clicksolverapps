/**
 * Divider Component
 * A simple horizontal or vertical divider line
 *
 * @component
 * @example
 * <Divider color="#E5E7EB" thickness={1} margin={16} />
 */

import React, {memo} from 'react';
import {View, StyleSheet} from 'react-native';
import {getColors} from '../../theme/colors';

/**
 * @typedef {'horizontal' | 'vertical'} DividerOrientation
 */

/**
 * @param {Object} props - Component props
 * @param {string} [props.color] - Custom divider color
 * @param {number} [props.thickness=1] - Divider thickness
 * @param {number} [props.margin=0] - Margin around divider
 * @param {DividerOrientation} [props.orientation='horizontal'] - Divider orientation
 * @param {boolean} [props.isDarkMode=false] - Dark mode flag
 * @param {object} [props.style] - Additional styles
 */
const Divider = ({
  color,
  thickness = 1,
  margin = 0,
  orientation = 'horizontal',
  isDarkMode = false,
  style,
  ...props
}) => {
  const colors = getColors(isDarkMode);
  const dividerColor = color || colors.divider;

  const dividerStyle =
    orientation === 'horizontal'
      ? {
          height: thickness,
          width: '100%',
          marginVertical: margin,
        }
      : {
          width: thickness,
          height: '100%',
          marginHorizontal: margin,
        };

  return (
    <View
      style={[
        styles.divider,
        dividerStyle,
        {backgroundColor: dividerColor},
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    alignSelf: 'stretch',
  },
});

export default memo(Divider);
