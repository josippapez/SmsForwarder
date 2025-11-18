import React, {useEffect, useState} from 'react';
import {
  ColorValue,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  useColorScheme,
  View,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import * as ExpoBackgroundService from './modules/expo-background-service';
import * as ExpoSmsListener from './modules/expo-sms-listener';
import * as ExpoSmsManager from './modules/expo-sms-manager';
import PermissionsPolicyModal from './Components/PermissionsPolicyModal';
import CustomButton from './Components/Shared/CustomButton';
import ToggleModal from './Components/ToggleModal';
import { useAtom } from 'jotai';
import {
  includesAtom,
  phoneNumberAtom,
  bodyAtom,
  readPermissionsPolicyAtom,
} from './store/atoms';

const Section = ({title, children, boldedTitle, sectionStyle, titleStyle}: {
  children?: string;
  title: string;
  boldedTitle?: boolean;
  sectionStyle?: any;
  titleStyle?: TextStyle;
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={[styles.sectionContainer, sectionStyle]}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
            fontWeight: boldedTitle ? '700' : '400',
          },
          titleStyle,
        ]}>
        {title}
      </Text>
      {children ? (
        <Text
          style={[
            styles.sectionDescription,
            {
              color: isDarkMode ? Colors.light : Colors.dark,
            },
          ]}>
          {children}
        </Text>
      ) : null}
    </View>
  );
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  
  const [includes, setIncludes] = useAtom(includesAtom);
  const [phoneNumber, setPhoneNumber] = useAtom(phoneNumberAtom);
  const [body, setBody] = useAtom(bodyAtom);
  const [readPermissionsPolicy, setReadPermissionsPolicy] = useAtom(readPermissionsPolicyAtom);

  const [displayPermissionsPolicy, setDisplayPermissionsPolicy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const toggleSwitch = () => setEnabled(prev => !prev);
  const toggleVisible = () => {
    if (!readPermissionsPolicy) {
      return setDisplayPermissionsPolicy(true);
    }
    setVisible(prev => !prev);
  };

  const includeData = includes.map(item => item.text);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : 'white',
    flex: 1,
  };

  const inputBackgroundStyle: TextStyle = {
    borderWidth: 1,
    fontSize: 20,
    borderRadius: 10,
    borderColor: 'transparent',
    backgroundColor: isDarkMode ? '#636363' : '#ffffff',
    color: isDarkMode ? Colors.white : Colors.black,
    paddingHorizontal: 10,
    paddingVertical: 8,
  };

  useEffect(() => {
    let subscription: any;

    if (enabled) {
      ExpoBackgroundService.startService();
      subscription = ExpoSmsListener.addListener((message: any) => {
        if (includeData.some(word => message.body.includes(word))) {
          ExpoSmsManager.send(
            phoneNumber,
            body !== '' ? body : message.body,
          )
            .then((success: any) => {
              console.log('SMS sent successfully', success);
            })
            .catch((error: any) => {
              console.log('Failed with this error: ' + error);
            });
        }
      });
    } else {
      ExpoBackgroundService.stopService();
      ExpoSmsListener.stopService();
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, includeData, phoneNumber, body]);

  async function getPhoneNumber() {
    try {
      const {status} = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Contacts permission is required to select a phone number.',
        );
        return null;
      }

      const {data} = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length === 0) {
        Alert.alert('No contacts', 'No contacts found on this device.');
        return null;
      }

      const contactWithPhone = data.find(
        contact => contact.phoneNumbers && contact.phoneNumbers.length > 0,
      );

      if (contactWithPhone && contactWithPhone.phoneNumbers) {
        const phoneNum = contactWithPhone.phoneNumbers[0].number;
        console.log(
          `Selected phone number ${phoneNum} from ${contactWithPhone.name}`,
        );
        return phoneNum;
      }

      return null;
    } catch (error) {
      console.error('Error selecting contact:', error);
      return null;
    }
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar
        animated={true}
        translucent
        backgroundColor={(isDarkMode ? '#000' : 'white') as ColorValue}
        barStyle={
          (isDarkMode ? 'light-content' : 'dark-content') as StatusBarStyle
        }
        showHideTransition={'fade'}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
        style={backgroundStyle}>
        <Section
          boldedTitle
          title="SMS Forwarder"
          sectionStyle={{
            paddingVertical: 20,
          }}
        />
        <View
          style={{
            paddingVertical: 30,
            paddingHorizontal: 20,
            borderRadius: 30,
            backgroundColor: isDarkMode ? Colors.dark : '#f5f5f5',
          }}>
          <Section
            sectionStyle={{
              marginTop: 0,
            }}
            titleStyle={{
              fontWeight: '500',
            }}
            title="Message includes...">
            If message includes any of the inputs (case sensitive)
          </Section>
          {includes && includes.length > 0
            ? includes.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    marginTop: index > 0 ? 10 : 0,
                  }}>
                  <TextInput
                    style={[
                      inputBackgroundStyle,
                      {
                        flex: 1,
                      },
                    ]}
                    value={item.text}
                    onChangeText={text => {
                      setIncludes([
                        ...includes.slice(0, index),
                        {
                          id: item.id,
                          text,
                        },
                        ...includes.slice(index + 1),
                      ]);
                    }}
                  />
                  <CustomButton
                    cb={() =>
                      setIncludes([
                        ...includes.slice(0, index),
                        ...includes.slice(index + 1),
                      ])
                    }
                    buttonStyle={{
                      marginLeft: 10,
                    }}
                  />
                </View>
              ))
            : null}
          {includes && includes.length < 7 ? (
            <CustomButton
              buttonStyle={{
                marginTop: 20,
              }}
              cb={() =>
                setIncludes([
                  ...includes,
                  {text: '', id: Date.now().toString()},
                ])
              }
            />
          ) : null}
        </View>
        <View
          style={{
            paddingVertical: 30,
            paddingHorizontal: 20,
            borderRadius: 30,
            backgroundColor: isDarkMode ? Colors.dark : '#f5f5f5',
            marginTop: 20,
          }}>
          <Section
            title="Phone number"
            titleStyle={{
              fontWeight: '500',
            }}
            sectionStyle={{
              marginTop: 0,
            }}>
            Choose a phone number to forward/send SMS to
          </Section>
          <TextInput
            style={inputBackgroundStyle}
            value={phoneNumber}
            onChangeText={text => {
              setPhoneNumber(text);
            }}
          />
          <Section
            title="OR"
            boldedTitle
            sectionStyle={{
              marginTop: 20,
            }}
          />
          <CustomButton
            title="Select phone number"
            cb={async () => {
              const phone = await getPhoneNumber();
              if (phone) {
                setPhoneNumber(phone);
              }
            }}
            buttonStyle={{
              borderRadius: 16,
              paddingHorizontal: 26,
              paddingVertical: 16,
            }}
            textStyle={{
              fontWeight: 'bold',
            }}
          />
        </View>
        <View
          style={{
            paddingVertical: 30,
            paddingHorizontal: 20,
            borderRadius: 30,
            backgroundColor: isDarkMode ? Colors.dark : '#f5f5f5',
            marginTop: 20,
            marginBottom: 20,
          }}>
          <Section
            title="Custom SMS message"
            titleStyle={{
              fontWeight: '500',
            }}
            sectionStyle={{
              marginTop: 0,
            }}>
            Leave blank to send the original message
          </Section>
          <TextInput
            style={inputBackgroundStyle}
            value={body}
            onChangeText={text => setBody(text)}
          />
        </View>
        <CustomButton
          title={enabled ? 'Stop' : 'Start'}
          cb={toggleVisible}
          buttonStyle={{
            borderRadius: 16,
            paddingHorizontal: 26,
            paddingVertical: 16,
          }}
          textStyle={{
            fontWeight: 'bold',
          }}
        />
      </ScrollView>
      <PermissionsPolicyModal
        visible={displayPermissionsPolicy}
        setVisible={(state: boolean) => {
          setDisplayPermissionsPolicy(state);
        }}
        setDisplayToggleModal={() => {
          setVisible(true);
          setReadPermissionsPolicy(true);
        }}
      />
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
    fontSize: 22,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
