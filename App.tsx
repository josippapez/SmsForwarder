import React, { useEffect, useState } from "react";
import {
  useColorScheme,
  ColorValue,
  StatusBar,
  StatusBarStyle,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAtom } from "jotai";
import { Colors } from "./constants/colors";
import HomeScreen from "./screens/HomeScreen";
import HistoryScreen from "./screens/HistoryScreen";
import { migrateToMultipleRules } from "./utils/migration";
import { advancedModeAtom } from "./store/atoms";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

const RulesIcon = ({ size }: { size: number }) => (
  <TabIcon name="📝" size={size} />
);

// Rules Stack Navigator
const RulesStack = () => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? Colors.darker : Colors.white,
        },
        headerTintColor: isDarkMode ? Colors.lighter : Colors.darker,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="RulesList"
        component={require("./screens/RulesListScreen").default}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditRule"
        component={require("./screens/EditRuleScreen").default}
        options={({ route }: any) => ({
          title: route.params?.ruleId ? "Edit Rule" : "New Rule",
        })}
      />
    </Stack.Navigator>
  );
};

/**
 * Main App Component with Navigation
 * Contains bottom tab navigation between Home (SMS configuration) and History screens
 */
const App = () => {
  const isDarkMode = useColorScheme() === "dark";
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [advancedMode] = useAtom(advancedModeAtom);

  useEffect(() => {
    // Run migration on app startup
    const runMigration = async () => {
      try {
        await migrateToMultipleRules();
      } catch (error) {
        console.error("Migration error:", error);
      } finally {
        setMigrationComplete(true);
      }
    };

    runMigration();
  }, []);

  // Show loading screen during migration
  if (!migrationComplete) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}
        >
          <ActivityIndicator
            size="large"
            color={isDarkMode ? Colors.lighter : Colors.darker}
          />
          <Text
            style={{
              marginTop: 16,
              color: isDarkMode ? Colors.lighter : Colors.darker,
              fontSize: 16,
            }}
          >
            Initializing...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

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
          {advancedMode && (
            <Tab.Screen
              name="Rules"
              component={RulesStack}
              options={{
                tabBarLabel: "Rules",
                tabBarIcon: RulesIcon,
              }}
            />
          )}
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
