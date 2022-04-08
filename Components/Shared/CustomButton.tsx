import React from 'react';
import {
  FlexAlignType,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  title: string;
  cb: () => void;
  buttonStyle?: Partial<ViewStyle>;
  textStyle?: Partial<TextStyle>;
  align?: FlexAlignType;
};

const CustomButton = (props: Props) => {
  const {title, cb, buttonStyle, textStyle, align} = props;
  const isDarkMode = useColorScheme() === 'dark';

  CustomButton.defaultProps.buttonStyle = {
    ...CustomButton.defaultProps.buttonStyle,
    backgroundColor: isDarkMode ? '#5e5e5e' : '#dceaf9',
  };

  CustomButton.defaultProps.textStyle = {
    ...CustomButton.defaultProps.textStyle,
    color: isDarkMode ? 'white' : 'black',
  };

  return (
    <TouchableOpacity
      style={[
        CustomButton.defaultProps.buttonStyle,
        buttonStyle,
        {
          alignSelf: align,
          width: buttonStyle.width,
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
        },
      ]}
      onPress={cb}>
      <Text
        adjustsFontSizeToFit
        style={[CustomButton.defaultProps.textStyle, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

CustomButton.defaultProps = {
  buttonStyle: {
    borderRadius: 20,
    padding: 10,
    width: 'auto',
  } as Partial<ViewStyle>,
  textStyle: {
    fontSize: 15,
  } as Partial<TextStyle>,
  align: 'center' as FlexAlignType,
};

export default CustomButton;
