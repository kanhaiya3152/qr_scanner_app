import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const QRScanner = ({ onClose, onScanComplete }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermissions();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const saveScanToDatabase = async (data, location = null) => {
    try {
      const scanData = {
        userId: user?.uid || 'demo-user',
        userEmail: user?.email || 'demo@example.com',
        qrData: data,
        timestamp: serverTimestamp(),
        location: location,
      };
      await addDoc(collection(db, 'scans'), scanData);
      return true;
    } catch (error) {
      console.error('Error saving scan:', error);
      return false;
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const location = await getLocation();
      const saved = await saveScanToDatabase(data, location);

      if (saved) {
        Alert.alert(
          'QR Code Scanned!',
          `Data: ${data}${location ? `\nLocation: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : ''}`,
          [
            {
              text: 'Scan Another',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              },
            },
            {
              text: 'Done',
              onPress: () => {
                onScanComplete?.();
                onClose?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save scan data');
        setScanned(false);
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'An error occurred while processing the scan');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [Camera.Constants.BarCodeType.qr],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanArea} />
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>

        <Text style={styles.instructionText}>
          Point your camera at a QR code to scan
        </Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Processing scan...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // same as yours, omitted here for brevity
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  middleRow: { flexDirection: 'row', height: 250 },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  closeButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: { alignItems: 'center', marginTop: 15 },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16 },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default QRScanner;
