import React from "react";
import {
  useColorScheme,
  ColorValue,
  StatusBar,
  StatusBarStyle,
  Text,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Colors } from "./constants/colors";
import HomeScreen from "./screens/HomeScreen";
import HistoryScreen from "./screens/HistoryScreen";

const Tab = createBottomTabNavigator();

// Simple icon component using emoji for now (can be replaced with icon library later)
const TabIcon = ({ name, size }: { name: string; size: number }) => {
  return <Text style={{ fontSize: size * 0.8 }}>{name}</Text>;
};

// Tab icon components
const HomeIcon = ({ size }: { size: number }) => (
  <TabIcon name="⚙️" size={size} />
);

const HistoryIcon = ({ size }: { size: number }) => (
  <TabIcon name="📋" size={size} />
);

/**
 * Main App Component with Navigation
 * Contains bottom tab navigation between Home (SMS configuration) and History screens
 */
const App = () => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaProvider>
      <StatusBar
        animated={true}
        translucent
        backgroundColor={
          (isDarkMode ? Colors.black : Colors.white) as ColorValue
        }
        barStyle={
          (isDarkMode ? "light-content" : "dark-content") as StatusBarStyle
        }
        showHideTransition={"fade"}
      />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: isDarkMode ? Colors.darker : Colors.white,
              borderTopColor: isDarkMode ? Colors.dark : Colors.lighter,
              elevation: 0,
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: isDarkMode ? Colors.light : Colors.dark,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: "Configure",
              tabBarIcon: HomeIcon,
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              tabBarLabel: "History",
              tabBarIcon: HistoryIcon,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
