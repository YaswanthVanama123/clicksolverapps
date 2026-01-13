/**
 * Atomic Components Usage Examples
 *
 * This file demonstrates how to use all atomic components together
 * Copy and paste these examples into your screens
 */

import React, {useState} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {
  GradientButton,
  Input,
  Text,
  Icon,
  Badge,
  Chip,
  Divider,
  Avatar,
  Skeleton,
} from './index';

const AtomicComponentsExample = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedChip, setSelectedChip] = useState('all');
  const isDarkMode = false; // Get from theme context

  return (
    <ScrollView style={styles.container}>
      {/* Text Examples */}
      <View style={styles.section}>
        <Text variant="h2" weight="bold">
          Text Components
        </Text>
        <Text variant="h3" weight="semibold">
          This is an H3 heading
        </Text>
        <Text variant="body1">Regular body text with default styling</Text>
        <Text variant="body2" color="#6B7280">
          Smaller body text with custom color
        </Text>
        <Text variant="caption">Caption text for additional info</Text>
      </View>

      <Divider margin={20} />

      {/* Button Examples */}
      <View style={styles.section}>
        <Text variant="h3" weight="bold">
          Buttons
        </Text>

        <GradientButton
          variant="primary"
          title="Primary Button"
          onPress={() => console.log('Primary')}
          icon="check"
          style={styles.button}
        />

        <GradientButton
          variant="secondary"
          title="Secondary Button"
          onPress={() => console.log('Secondary')}
          style={styles.button}
        />

        <GradientButton
          variant="outline"
          title="Outline Button"
          onPress={() => console.log('Outline')}
          icon="heart"
          style={styles.button}
        />

        <View style={styles.row}>
          <GradientButton
            variant="icon"
            icon="plus"
            onPress={() => console.log('Add')}
            size="small"
          />
          <GradientButton
            variant="icon"
            icon="delete"
            onPress={() => console.log('Delete')}
            size="medium"
            style={styles.iconButton}
          />
          <GradientButton
            variant="icon"
            icon="share"
            onPress={() => console.log('Share')}
            size="large"
            style={styles.iconButton}
          />
        </View>

        <GradientButton
          variant="primary"
          title="Loading..."
          loading={true}
          style={styles.button}
        />
      </View>

      <Divider margin={20} />

      {/* Input Examples */}
      <View style={styles.section}>
        <Text variant="h3" weight="bold">
          Input Fields
        </Text>

        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          leftIcon="email"
          keyboardType="email-address"
        />

        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          leftIcon="lock"
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword(!showPassword)}
          secureTextEntry={!showPassword}
        />

        <Input
          value="Error state example"
          onChangeText={() => {}}
          placeholder="Username"
          leftIcon="account"
          error="This username is already taken"
        />
      </View>

      <Divider margin={20} />

      {/* Badge Examples */}
      <View style={styles.section}>
        <Text variant="h3" weight="bold">
          Badges
        </Text>
        <View style={styles.row}>
          <Badge variant="success" style={styles.badge}>
            Success
          </Badge>
          <Badge variant="warning" style={styles.badge}>
            Warning
          </Badge>
          <Badge variant="error" style={styles.badge}>
            Error
          </Badge>
          <Badge variant="info" style={styles.badge}>
            Info
          </Badge>
          <Badge variant="primary" style={styles.badge}>
            Primary
          </Badge>
        </View>

        <View style={styles.row}>
          <Badge variant="success" size="small" style={styles.badge}>
            Small
          </Badge>
          <Badge variant="primary" size="medium" style={styles.badge}>
            Medium
          </Badge>
          <Badge variant="error" size="large" style={styles.badge}>
            Large
          </Badge>
        </View>
      </View>

      <Divider margin={20} />

      {/* Chip Examples */}
      <View style={styles.section}>
        <Text variant="h3" weight="bold">
          Chips
        </Text>
        <View style={styles.row}>
          <Chip
            label="All"
            selected={selectedChip === 'all'}
            onPress={() => setSelectedChip('all')}
            icon="apps"
            style={styles.chip}
          />
          <Chip
            label="Services"
            selected={selectedChip === 'services'}
            onPress={() => setSelectedChip('services')}
            icon="briefcase"
            style={styles.chip}
          />
          <Chip
            label="Products"
            selected={selectedChip === 'products'}
            onPress={() => setSelectedChip('products')}
            icon="package-variant"
            style={styles.chip}
          />
        </View>
      </View>

      <Divider margin={20} />

      {/* Icon Examples */}
      <View style={styles.section}>
        <Text variant="h3" weight="bold">
          Icons
        </Text>
        <View style={styles.row}>
          <Icon name="home" size={32} color="#FF6B35" />
          <Icon name="heart" size={32} color="#EF4444" style={styles.icon} />
          <Icon name="star" size={32} color="#FBBF24" style={styles.icon} />
          <Icon
            name="shield-check"
            size={32}
            gradient="primaryGradient"
            style={styles.icon}
          />
          <Icon
            name="medal"
            size={32}
            gradient="secondaryGradient"
            style={styles.icon}
          />
        </View>
      </View>

      <Divider margin={20} />

      {/* Avatar Examples */}
      <View style={styles.section}>
        <Text variant="h3" weight="bold">
          Avatars
        </Text>
        <View style={styles.row}>
          <Avatar name="John Doe" size="small" />
          <Avatar
            name="Jane Smith"
            size="medium"
            gradient="secondaryGradient"
            style={styles.avatar}
          />
          <Avatar
            name="Bob Wilson"
            size="large"
            gradient="accentGradient"
            style={styles.avatar}
          />
          <Avatar
            source={{uri: 'https://i.pravatar.cc/150?img=1'}}
            name="User"
            size="medium"
            style={styles.avatar}
          />
        </View>
      </View>

      <Divider margin={20} />

      {/* Skeleton Examples */}
      <View style={styles.section}>
        <Text variant="h3" weight="bold">
          Loading Skeletons
        </Text>
        <View style={styles.row}>
          <Skeleton variant="circle" width={48} height={48} />
          <View style={styles.skeletonText}>
            <Skeleton width={200} height={16} style={styles.skeletonItem} />
            <Skeleton width={150} height={12} style={styles.skeletonItem} />
          </View>
        </View>
        <Skeleton width="100%" height={100} borderRadius={12} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  section: {
    marginBottom: 8,
  },
  button: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
  },
  badge: {
    marginRight: 8,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  icon: {
    marginLeft: 16,
  },
  iconButton: {
    marginLeft: 12,
  },
  avatar: {
    marginLeft: 12,
  },
  skeletonText: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonItem: {
    marginBottom: 8,
  },
});

export default AtomicComponentsExample;
