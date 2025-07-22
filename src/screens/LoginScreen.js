import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = isRegistering 
        ? await register(email, password)
        : await login(email, password);

      if (!result.success) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {isRegistering ? 'Create Account' : 'QR Scanner Login'}
        </Text>
        
        <View style={styles.demoInfo}>
          <Text style={styles.demoText}>Demo Credentials:</Text>
          <Text style={styles.demoText}>Email: demo@example.com</Text>
          <Text style={styles.demoText}>Password: demo123</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#white" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? 'Register' : 'Login'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={styles.linkText}>
            {isRegistering 
              ? 'Already have an account? Login' 
              : "Don't have an account? Register"
            }
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  demoInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  demoText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#2196F3',
    fontSize: 16,
  },
});

export default LoginScreen;