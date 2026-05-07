/**
 * App Navigator — Stack + Bottom Tabs
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, FontSizes } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AttendanceFlow from '../screens/AttendanceFlow';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color }) {
  const icons = {
    Today: focused ? '📅' : '📋',
    History: focused ? '📊' : '📈',
    Profile: focused ? '👤' : '👥',
  };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>
        {icons[name] || '📌'}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: Colors.emerald400,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bgSecondary,
          borderTopColor: Colors.bgCardBorder,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSizes.xs,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      })}
    >
      <Tab.Screen name="Today" component={ScheduleScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>L</Text>
        <Text style={styles.loadingText}>LearnAvo</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgPrimary },
          animation: 'slide_from_right',
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AttendanceFlow"
              component={AttendanceFlow}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
    backgroundColor: Colors.emerald500,
    width: 80,
    height: 80,
    textAlign: 'center',
    lineHeight: 80,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
});
