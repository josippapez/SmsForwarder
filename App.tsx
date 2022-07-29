/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {
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
  ViewStyle,
} from 'react-native';
import {selectContactPhone} from 'react-native-select-contact';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import CheckBackgroundMessagesNativeModule from './CheckBackgroundMessagesNativeModule';
import CustomButton from './Components/Shared/CustomButton';
import ToggleModal from './Components/ToggleModal';
import {Fonts} from './Fonts';
import {useAppDispatch, useAppSelector} from './store/hooks';
import {setBody, setIncludes, setPhoneNumber} from './store/reducers/settings';
import Images from './Styles/Images/index';

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
  includes: [''],
  phoneNumber: '',
  body: '',
};

const App: () => JSX.Element = () => {
  const dispatch = useAppDispatch();
  const isDarkMode = useColorScheme() === 'dark';
  const settings = useAppSelector(state => state.settings);

  const [filterInput, setFilterInput] = useState(settings);
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
    borderRadius: 10,
    borderColor: 'transparent',
    backgroundColor: isDarkMode ? '#636363' : '#ffffff',
    color: isDarkMode ? Colors.white : Colors.black,
    paddingHorizontal: 10,
    flexGrow: 1,
  };

  React.useEffect(() => {
    filter = filterInput;
    if (filterInput.includes) {
      dispatch(setIncludes(filterInput.includes));
    }
    if (filterInput.phoneNumber) {
      dispatch(setPhoneNumber(filterInput.phoneNumber));
    }
    if (filterInput.body) {
      dispatch(setBody(filterInput.body));
    }
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
              fontWeight: Fonts['500'],
            }}
            title="Message includes...">
            Includes any of the inputs
          </Section>
          {filterInput.includes && filterInput.includes.length > 0
            ? filterInput.includes.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    marginTop: index > 0 ? 10 : 0,
                  }}>
                  <TextInput
                    style={inputBackgroundStyle}
                    value={item}
                    onChangeText={text =>
                      setFilterInput({
                        ...filterInput,
                        includes: [
                          ...filterInput.includes.slice(0, index),
                          text,
                          ...filterInput.includes.slice(index + 1),
                        ],
                      })
                    }
                  />
                  <CustomButton
                    cb={() =>
                      setFilterInput(
                        filterInput.includes.length > 0
                          ? {
                              ...filterInput,
                              includes: [
                                ...filterInput.includes.slice(0, index),
                                ...filterInput.includes.slice(index + 1),
                              ],
                            }
                          : filterInput,
                      )
                    }
                    backgroundimage={{
                      image: isDarkMode ? Images.minusWhite : Images.minus,
                      style: {
                        width: 30,
                        height: 30,
                      },
                    }}
                    buttonStyle={{
                      marginLeft: 15,
                    }}
                  />
                </View>
              ))
            : null}
          {filterInput.includes && filterInput.includes.length < 7 ? (
            <CustomButton
              buttonStyle={{
                marginTop: 20,
              }}
              cb={() =>
                setFilterInput(
                  filterInput.includes.length > 0
                    ? {
                        ...filterInput,
                        includes: [...filterInput.includes, ''],
                      }
                    : {
                        ...filterInput,
                        includes: [''],
                      },
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
              fontWeight: Fonts['500'],
            }}
            sectionStyle={{
              marginTop: 0,
            }}>
            Choose a phone number to forward SMS to
          </Section>
          <TextInput
            style={inputBackgroundStyle}
            value={filterInput.phoneNumber}
            onChangeText={text => {
              setFilterInput({...filterInput, phoneNumber: text});
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
              setFilterInput({...filterInput, phoneNumber: phone});
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
            title="Text"
            titleStyle={{
              fontWeight: Fonts['500'],
            }}
            sectionStyle={{
              marginTop: 0,
            }}
          />
          <TextInput
            style={inputBackgroundStyle}
            value={filterInput.body}
            onChangeText={text => setFilterInput({...filterInput, body: text})}
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
