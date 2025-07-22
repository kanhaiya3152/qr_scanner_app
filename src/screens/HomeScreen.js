import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import QRScanner from '../components/qrScanner.js';

const HomeScreen = ({ navigation }) => {
  const [showScanner, setShowScanner] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout }
      ]
    );
  };

  if (showScanner) {
    return (
      <QRScanner
        onClose={() => setShowScanner(false)}
        onScanComplete={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.email || 'User'}!
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Text style={styles.scanButtonText}>📱</Text>
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('ScanHistory')}
        >
          <Text style={styles.historyButtonText}>📋</Text>
          <Text style={styles.historyButtonText}>View Scan History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  historyButton: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 2,
  },
});

export default HomeScreen;