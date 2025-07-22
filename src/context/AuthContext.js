import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('userToken', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      // For demo purposes, allow demo login
      if (email === 'demo@example.com' && password === 'demo123') {
        const demoUser = { uid: 'demo-user', email: 'demo@example.com' };
        setUser(demoUser);
        await AsyncStorage.setItem('userToken', 'demo-user');
        return { success: true, user: demoUser };
      }
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('userToken', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};