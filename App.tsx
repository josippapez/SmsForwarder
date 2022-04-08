/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {
  Button,
  ColorValue,
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StatusBarAnimation,
  StatusBarStyle,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  useColorScheme,
  View,
} from 'react-native';
import {selectContactPhone} from 'react-native-select-contact';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import CheckBackgroundMessagesNativeModule from './CheckBackgroundMessagesNativeModule';
import CustomButton from './Components/Shared/CustomButton';
import ToggleModal from './Components/ToggleModal';
import {Fonts} from './Fonts';

type SectionProps = {
  children?: String;
  title: string;
  boldedTitle?: boolean;
};

export const Section = (props: SectionProps): JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';
  const {title, children, boldedTitle} = props;
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
            fontWeight: boldedTitle ? Fonts.bold : Fonts.normal,
          },
        ]}>
        {title}
      </Text>
      {children && (
        <Text
          style={[
            styles.sectionDescription,
            {
              color: isDarkMode ? Colors.light : Colors.dark,
            },
          ]}>
          {children}
        </Text>
      )}
    </View>
  );
};

export var filter = {
  includes: '',
  phoneNumber: '',
  body: '',
};

const App: () => JSX.Element = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [filterInput, setFilterInput] = useState(filter);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const toggleVisible = () => setVisible(previousState => !previousState);
  const toggleSwitch = () => setEnabled(previousState => !previousState);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : 'white',
    height: '100%',
  };

  const inputBackgroundStyle: Partial<TextStyle> = {
    borderWidth: 1,
    fontSize: 20,
    borderRadius: 5,
    borderColor: 'transparent',
    backgroundColor: isDarkMode ? Colors.dark : '#dceaf9',
    color: isDarkMode ? Colors.white : Colors.black,
    paddingHorizontal: 10,
  };

  React.useEffect(() => {
    filter = filterInput;
  }, [filterInput]);

  React.useEffect(() => {
    if (enabled) {
      CheckBackgroundMessagesNativeModule.startService();
    } else {
      CheckBackgroundMessagesNativeModule.stopService();
    }
  }, [enabled]);

  function getPhoneNumber() {
    return selectContactPhone().then(selection => {
      if (!selection) {
        return null;
      }

      let {contact, selectedPhone} = selection;
      console.log(
        `Selected ${selectedPhone.type} phone number ${selectedPhone.number} from ${contact.name}`,
      );
      return selectedPhone.number;
    });
  }

  return (
    <SafeAreaView>
      <StatusBar
        animated={true}
        translucent
        backgroundColor={(isDarkMode ? '#000' : 'white') as ColorValue}
        barStyle={
          (isDarkMode ? 'light-content' : 'dark-content') as StatusBarStyle
        }
        showHideTransition={'fade' as StatusBarAnimation}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        bounces
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
        style={backgroundStyle}>
        <Section boldedTitle title="SMS Forwarder" />
        <Section title="Message includes..." />
        <TextInput
          style={inputBackgroundStyle}
          value={filterInput.includes}
          onChangeText={text =>
            setFilterInput({...filterInput, includes: text})
          }
        />
        <Section title="Phone number">
          Choose a phone number to forward SMS to
        </Section>
        <TextInput
          style={inputBackgroundStyle}
          value={filterInput.phoneNumber}
          onChangeText={text => {
            setFilterInput({...filterInput, phoneNumber: text});
          }}
        />
        <Section title="OR" boldedTitle />
        <CustomButton
          title="Select phone number"
          cb={async () => {
            await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
              PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
            ]);
            const phone = await getPhoneNumber();
            setFilterInput({...filterInput, phoneNumber: phone});
          }}
          buttonStyle={{
            borderRadius: 16,
            width: 'auto',
            elevation: 2,
            paddingHorizontal: 26,
            paddingVertical: 16,
          }}
          textStyle={{
            fontWeight: 'bold',
          }}
        />
        <Section title="Text" />
        <TextInput
          style={inputBackgroundStyle}
          value={filterInput.body}
          onChangeText={text => setFilterInput({...filterInput, body: text})}
        />
        <Section title="Turn on/off" />
        <CustomButton
          title={enabled ? 'Stop' : 'Start'}
          cb={toggleVisible}
          buttonStyle={{
            borderRadius: 16,
            elevation: 2,
            paddingHorizontal: 26,
            paddingVertical: 16,
          }}
          textStyle={{
            fontWeight: 'bold',
          }}
        />
      </ScrollView>
      <ToggleModal
        isDarkMode={isDarkMode}
        visible={visible}
        setVisible={setVisible}
        enabled={enabled}
        toggleSwitch={toggleSwitch}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
  },
  sectionContainer: {
    marginTop: 32,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
