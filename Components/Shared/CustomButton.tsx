import {animated, AnimatedStyle} from '@react-spring/native';
import React from 'react';
import {
  FlexAlignType,
  ImageSourcePropType,
  ImageStyle,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  title?: string;
  cb: () => void;
  buttonStyle?: Partial<ViewStyle>;
  textStyle?: Partial<TextStyle>;
  align?: FlexAlignType;
  backgroundimage?: {
    image: ImageSourcePropType;
    style: ImageStyle | AnimatedStyle<ImageStyle>;
  };
};

const CustomButton = (props: Props) => {
  const {title, cb, buttonStyle, textStyle, align, backgroundimage} = props;

  const isDarkMode = useColorScheme() === 'dark';

  CustomButton.defaultProps.buttonStyle = {
    ...CustomButton.defaultProps.buttonStyle,
    backgroundColor: isDarkMode ? '#5e5e5e' : '#d3d9df',
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
      <View>
        {backgroundimage && (
          <animated.Image
            source={backgroundimage.image}
            style={backgroundimage.style}
            resizeMode={'cover'}
          />
        )}
        {title && (
          <Text
            adjustsFontSizeToFit
            style={[CustomButton.defaultProps.textStyle, textStyle]}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

CustomButton.defaultProps = {
  buttonStyle: {
    borderRadius: 20,
    padding: 10,
    width: 'auto',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  } as Partial<ViewStyle>,
  textStyle: {
    fontSize: 15,
  } as Partial<TextStyle>,
  align: 'center' as FlexAlignType,
};

export default CustomButton;
