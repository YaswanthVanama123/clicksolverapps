import React from 'react';
import { View, Button } from 'react-native';
import { changeAppLanguage } from '../i18n/languageChange';

const LanguageSelector = () => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-around', margin: 10 }}>
    <Button title="English" onPress={() => changeAppLanguage('en')} />
    <Button title="हिंदी" onPress={() => changeAppLanguage('hi')} />
    <Button title="తెలుగు" onPress={() => changeAppLanguage('te')} />
  </View>
);

export default LanguageSelector;
