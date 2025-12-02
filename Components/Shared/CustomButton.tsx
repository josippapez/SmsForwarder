import { animated, AnimatedStyle } from "@react-spring/native";
import React from "react";
import {
  FlexAlignType,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  title?: string;
  cb: () => void;
  buttonStyle?: Partial<ViewStyle>;
  textStyle?: Partial<TextStyle>;
  align?: FlexAlignType;
  backgroundimage?: {
    image: ImageSourcePropType;
    style: StyleProp<ImageStyle>;
  };
  disabled?: boolean;
};

const CustomButton = (props: Props) => {
  const {
    title,
    cb,
    buttonStyle,
    textStyle,
    align,
    backgroundimage,
    disabled = false,
  } = props;

  const isDarkMode = useColorScheme() === "dark";

  CustomButton.defaultProps.buttonStyle = {
    ...CustomButton.defaultProps.buttonStyle,
    backgroundColor: isDarkMode ? "#5e5e5e" : "#d3d9df",
  };

  CustomButton.defaultProps.textStyle = {
    ...CustomButton.defaultProps.textStyle,
    color: isDarkMode ? "white" : "black",
  };

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        CustomButton.defaultProps.buttonStyle,
        buttonStyle,
        {
          alignSelf: align,
          width: buttonStyle?.width,
          justifyContent: "center",
          display: "flex",
          alignItems: "center",
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      onPress={cb}
    >
      <View>
        {backgroundimage && (
          <animated.Image
            source={backgroundimage.image}
            style={backgroundimage.style as any}
            resizeMode={"cover"}
          />
        )}
        {title && (
          <Text
            adjustsFontSizeToFit
            style={[CustomButton.defaultProps.textStyle, textStyle]}
          >
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
    width: "auto",
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
  align: "center" as FlexAlignType,
};

export default CustomButton;
