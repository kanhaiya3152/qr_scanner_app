import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext.js';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanHistoryScreen from './src/screens/ScanHistoryScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ScanHistory" 
              component={ScanHistoryScreen}
              options={{
                title: 'Scan History',
                headerStyle: { backgroundColor: '#2196F3' },
                headerTintColor: 'white',
                headerTitleStyle: { fontWeight: 'bold' }
              }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}