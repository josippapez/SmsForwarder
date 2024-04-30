import {animated} from '@react-spring/native';
import React, {useEffect, useState} from 'react';
import {
  ColorValue,
  NativeModules,
  PermissionsAndroid,
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
  ViewStyle,
} from 'react-native';
import {selectContactPhone} from 'react-native-select-contact';
import uuid from 'react-native-uuid';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import CheckBackgroundMessagesNativeModule from './CheckBackgroundMessagesNativeModule';
import PermissionsPolicyModal from './Components/PermissionsPolicyModal';
import CustomButton from './Components/Shared/CustomButton';
import ToggleModal from './Components/ToggleModal';
import {Fonts} from './Fonts';
import SmsListener from './SmsListener';
import {useAppDispatch, useAppSelector} from './store/hooks';
import {
  setBody,
  setIncludes,
  setPhoneNumber,
  setReadPermissionsPolicy,
} from './store/reducers/settings';
import Images from './Styles/Images/index';

const {Sms} = NativeModules;

type SectionProps = {
  children?: string;
  title: string;
  boldedTitle?: boolean;
  sectionStyle?: ViewStyle;
  titleStyle?: TextStyle;
};

export const Section = (props: SectionProps): JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';
  const {title, children, boldedTitle, sectionStyle, titleStyle} = props;
  return (
    <View style={[styles.sectionContainer, sectionStyle]}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
            fontWeight: boldedTitle
              ? titleStyle?.fontWeight
                ? titleStyle.fontWeight
                : Fonts.bold
              : Fonts.normal,
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

export var filter = {
  includes: [{id: '1', text: ''}],
  phoneNumber: '',
  body: '',
};

const App: () => JSX.Element = () => {
  const dispatch = useAppDispatch();
  const isDarkMode = useColorScheme() === 'dark';
  const settings = useAppSelector(state => state.settings);

  const [displayPermissionsPolicy, setDisplayPermissionsPolicy] =
    useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const toggleSwitch = () => setEnabled(previousState => !previousState);
  const toggleVisible = () => {
    if (!settings.readPermissionsPolicy) {
      return setDisplayPermissionsPolicy(true);
    }
    setVisible(previousState => !previousState);
  };

  const includeData = settings.includes.map(item => item.text);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : 'white',
    height: '100%',
  };

  const inputBackgroundStyle: Partial<TextStyle> = {
    borderWidth: 1,
    fontSize: 20,
    borderRadius: 10,
    borderColor: 'transparent',
    backgroundColor: isDarkMode ? '#636363' : '#ffffff',
    color: isDarkMode ? Colors.white : Colors.black,
    paddingHorizontal: 10,
  };

  useEffect(() => {
    filter = settings;
    setEnabled(false);
  }, [settings]);

  useEffect(() => {
    if (enabled) {
      CheckBackgroundMessagesNativeModule.startService();
      SmsListener.addListener(message => {
        if (includeData.some(word => message.body.includes(word))) {
          Sms.autoSend(
            JSON.stringify(settings.phoneNumber),
            settings.body !== '' ? settings.body : message.body,
            fail => {
              console.log('Failed with this error: ' + fail);
            },
            success => {
              console.log('SMS sent successfully', success);
            },
          );
        }
      });
    } else {
      CheckBackgroundMessagesNativeModule.stopService();
      SmsListener.stopService();
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

  // const inputTransitions = useTransition(settings.includes, {
  //   from: {opacity: 0, scale: 0.75, height: 45, imageHeight: 30},
  //   enter: {opacity: 1, scale: 1, height: 45, imageHeight: 30},
  //   leave: {opacity: 0, scale: 0.75, height: 0, imageHeight: 0},
  //   config: {duration: 200},
  //   trail: 250 / settings.includes.length,
  // });

  return (
    <SafeAreaView>
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
        <animated.View
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
              fontWeight: Fonts['500'],
            }}
            title="Message includes...">
            If message includes any of the inputs (case sensitive)
          </Section>
          {settings.includes && settings.includes.length > 0
            ? settings.includes.map((item, index) => (
                <animated.View
                  key={item.id}
                  style={[
                    {
                      display: 'flex',
                      flexDirection: 'row',
                      marginTop: index > 0 ? 10 : 0,
                    },
                  ]}>
                  <TextInput
                    style={[
                      inputBackgroundStyle,
                      {
                        flex: 1,
                      },
                    ]}
                    value={item.text}
                    onChangeText={text => {
                      dispatch(
                        setIncludes([
                          ...settings.includes.slice(0, index),
                          {
                            id: item.id,
                            text,
                          },
                          ...settings.includes.slice(index + 1),
                        ]),
                      );
                    }}
                  />
                  <CustomButton
                    cb={() =>
                      dispatch(
                        setIncludes([
                          ...settings.includes.slice(0, index),
                          ...settings.includes.slice(index + 1),
                        ]),
                      )
                    }
                    backgroundimage={{
                      image: isDarkMode ? Images.minusWhite : Images.minus,
                      style: {
                        height: 30,
                        width: 30,
                      },
                    }}
                    buttonStyle={{
                      marginLeft: 10,
                    }}
                  />
                </animated.View>
              ))
            : null}
          {settings.includes && settings.includes.length < 7 ? (
            <CustomButton
              buttonStyle={{
                marginTop: 20,
              }}
              cb={() =>
                dispatch(
                  setIncludes([
                    ...settings.includes,
                    {text: '', id: uuid.v4() as string},
                  ]),
                )
              }
              backgroundimage={{
                image: isDarkMode ? Images.addWhite : Images.add,
                style: {
                  width: 30,
                  height: 30,
                },
              }}
            />
          ) : null}
        </animated.View>
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
              fontWeight: Fonts['500'],
            }}
            sectionStyle={{
              marginTop: 0,
            }}>
            Choose a phone number to forward/send SMS to
          </Section>
          <TextInput
            style={inputBackgroundStyle}
            value={settings.phoneNumber}
            onChangeText={text => {
              dispatch(setPhoneNumber(text));
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
              await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
              ]);
              const phone = await getPhoneNumber();
              if (phone) {
                dispatch(setPhoneNumber(phone));
              }
            }}
            buttonStyle={{
              borderRadius: 16,
              width: 'auto',
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
              fontWeight: Fonts['500'],
            }}
            sectionStyle={{
              marginTop: 0,
            }}>
            Leave blank to send the original message
          </Section>
          <TextInput
            style={inputBackgroundStyle}
            value={settings.body}
            onChangeText={text => dispatch(setBody(text))}
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
          dispatch(setReadPermissionsPolicy(true));
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
