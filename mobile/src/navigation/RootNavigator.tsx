import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/vehicle/HomeScreen';
import VehicleListScreen from '../screens/vehicle/VehicleListScreen';
import VehicleDetailScreen from '../screens/vehicle/VehicleDetailScreen';
import BookingListScreen from '../screens/booking/BookingListScreen';
import BookingDetailScreen from '../screens/booking/BookingDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import { useAuth } from '../store/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Vehicles') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerTitle: 'Trang chủ' }}
      />
      <Tab.Screen 
        name="Vehicles" 
        component={VehicleListScreen}
        options={{ headerTitle: 'Xe điện' }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingListScreen}
        options={{ headerTitle: 'Đơn thuê' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerTitle: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export function RootNavigator() {
  const { user, loading } = useAuth();

  // Convert to boolean explicitly
  const isLoading = Boolean(loading);
  const hasUser = Boolean(user);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {hasUser ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
          />
          <Stack.Screen 
            name="VehicleDetail" 
            component={VehicleDetailScreen}
            options={{ 
              headerShown: true,
              headerTitle: 'Chi tiết xe' 
            }}
          />
          <Stack.Screen 
            name="BookingDetail" 
            component={BookingDetailScreen}
            options={{ 
              headerShown: true,
              headerTitle: 'Chi tiết đơn thuê' 
            }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthStack}
        />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
