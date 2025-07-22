import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  Share,
  Linking,
  Dimensions
} from 'react-native';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ScanHistoryScreen = ({ navigation }) => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredScans, setFilteredScans] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, today, week, month
  const { user } = useAuth();

  useEffect(() => {
    fetchScanHistory();
  }, []);

  useEffect(() => {
    filterScans();
  }, [searchText, scans, selectedFilter]);

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      
      // Create demo data if no user or if it's demo user
      if (!user || user.uid === 'demo-user') {
        const demoScans = await getDemoScans();
        setScans(demoScans);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'scans'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const scanData = [];
      
      querySnapshot.forEach((doc) => {
        scanData.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });

      setScans(scanData);
      
      // Also save to local storage as backup
      await AsyncStorage.setItem('scanHistory', JSON.stringify(scanData));
      
    } catch (error) {
      console.error('Error fetching scan history:', error);
      // Try to load from local storage if Firebase fails
      try {
        const localScans = await AsyncStorage.getItem('scanHistory');
        if (localScans) {
          const parsedScans = JSON.parse(localScans);
          setScans(parsedScans.map(scan => ({
            ...scan,
            timestamp: new Date(scan.timestamp)
          })));
        }
      } catch (localError) {
        console.error('Error loading local scan history:', localError);
        Alert.alert('Error', 'Failed to load scan history');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDemoScans = async () => {
    // Check if we have saved demo scans in AsyncStorage
    try {
      const savedDemoScans = await AsyncStorage.getItem('demoScans');
      if (savedDemoScans) {
        const parsedScans = JSON.parse(savedDemoScans);
        return parsedScans.map(scan => ({
          ...scan,
          timestamp: new Date(scan.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading demo scans:', error);
    }

    // Default demo data
    const demoScans = [
      {
        id: '1',
        qrData: 'https://expo.dev',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        location: { latitude: 40.7128, longitude: -74.0060 },
        type: 'url'
      },
      {
        id: '2',
        qrData: 'Hello World QR Code - This is a simple text QR code for testing',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        location: null,
        type: 'text'
      },
      {
        id: '3',
        qrData: 'https://reactnative.dev/docs/getting-started',
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        location: { latitude: 37.7749, longitude: -122.4194 },
        type: 'url'
      },
      {
        id: '4',
        qrData: 'Contact: John Doe\nPhone: +1-555-123-4567\nEmail: john@example.com',
        timestamp: new Date(Date.now() - 345600000), // 4 days ago
        location: { latitude: 34.0522, longitude: -118.2437 },
        type: 'contact'
      },
      {
        id: '5',
        qrData: 'WiFi:T:WPA;S:MyNetwork;P:password123;H:false;;',
        timestamp: new Date(Date.now() - 432000000), // 5 days ago
        location: null,
        type: 'wifi'
      }
    ];

    // Save demo scans to AsyncStorage
    try {
      await AsyncStorage.setItem('demoScans', JSON.stringify(demoScans));
    } catch (error) {
      console.error('Error saving demo scans:', error);
    }

    return demoScans;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchScanHistory();
    setRefreshing(false);
  }, []);

  const filterScans = () => {
    let filtered = scans;

    // Apply time filter
    if (selectedFilter !== 'all') {
      const now = new Date();
      let cutoffDate;

      switch (selectedFilter) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = null;
      }

      if (cutoffDate) {
        filtered = filtered.filter(scan => scan.timestamp >= cutoffDate);
      }
    }

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(scan => 
        scan.qrData.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredScans(filtered);
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 2) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };

  const getQRType = (data) => {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return { type: 'url', icon: '🌐', color: '#2196F3' };
    } else if (data.startsWith('mailto:')) {
      return { type: 'email', icon: '📧', color: '#FF9800' };
    } else if (data.startsWith('tel:')) {
      return { type: 'phone', icon: '📞', color: '#4CAF50' };
    } else if (data.startsWith('WiFi:')) {
      return { type: 'wifi', icon: '📶', color: '#9C27B0' };
    } else if (data.includes('Contact:') || data.includes('VCARD')) {
      return { type: 'contact', icon: '👤', color: '#FF5722' };
    } else {
      return { type: 'text', icon: '📝', color: '#607D8B' };
    }
  };

  const handleScanPress = (scan) => {
    const qrType = getQRType(scan.qrData);
    
    Alert.alert(
      'QR Code Details',
      scan.qrData,
      [
        { text: 'Copy', onPress: () => copyToClipboard(scan.qrData) },
        qrType.type === 'url' && { text: 'Open URL', onPress: () => openURL(scan.qrData) },
        { text: 'Share', onPress: () => shareQRData(scan.qrData) },
        { text: 'Delete', onPress: () => deleteScan(scan), style: 'destructive' },
        { text: 'Close', style: 'cancel' }
      ].filter(Boolean)
    );
  };

  const copyToClipboard = (text) => {
    // In a real app, you'd use @react-native-clipboard/clipboard
    Alert.alert('Copied', 'QR code data copied to clipboard');
  };

  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const shareQRData = async (data) => {
    try {
      await Share.share({
        message: data,
        title: 'QR Code Data'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const deleteScan = async (scan) => {
    try {
      if (user && user.uid !== 'demo-user') {
        // Delete from Firebase
        await deleteDoc(doc(db, 'scans', scan.id));
      } else {
        // Delete from demo data
        const updatedDemoScans = scans.filter(s => s.id !== scan.id);
        await AsyncStorage.setItem('demoScans', JSON.stringify(updatedDemoScans));
      }
      
      // Update local state
      const updatedScans = scans.filter(s => s.id !== scan.id);
      setScans(updatedScans);
      
      Alert.alert('Success', 'Scan deleted successfully');
    } catch (error) {
      console.error('Error deleting scan:', error);
      Alert.alert('Error', 'Failed to delete scan');
    }
  };

  const clearAllScans = () => {
    Alert.alert(
      'Clear All Scans',
      'Are you sure you want to delete all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (user && user.uid !== 'demo-user') {
                // Delete all user scans from Firebase (would need batch delete in real app)
                // For demo, just clear local state
              }
              await AsyncStorage.removeItem('demoScans');
              setScans([]);
              Alert.alert('Success', 'All scans cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear scans');
            }
          }
        }
      ]
    );
  };

  const renderFilterButton = (filter, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderScanItem = ({ item }) => {
    const qrType = getQRType(item.qrData);
    
    return (
      <TouchableOpacity 
        style={styles.scanItem}
        onPress={() => handleScanPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.scanItemHeader}>
          <View style={[styles.typeIcon, { backgroundColor: qrType.color }]}>
            <Text style={styles.typeIconText}>{qrType.icon}</Text>
          </View>
          <View style={styles.scanItemInfo}>
            <Text style={styles.scanData} numberOfLines={2}>
              {item.qrData}
            </Text>
            <Text style={styles.scanDate}>
              {formatDate(item.timestamp)}
            </Text>
            {item.location && (
              <Text style={styles.locationText}>
                📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
              </Text>
            )}
          </View>
          <View style={styles.scanItemActions}>
            <Text style={styles.tapHint}>Tap for options</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading scan history...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <View style={styles.headerActions}>
          {scans.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearAllScans}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search scans..."
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('today', 'Today')}
        {renderFilterButton('week', 'Week')}
        {renderFilterButton('month', 'Month')}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredScans.length} {filteredScans.length === 1 ? 'scan' : 'scans'}
          {searchText && ` found for "${searchText}"`}
        </Text>
      </View>

      {filteredScans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyText}>
            {searchText ? 'No matching scans found' : selectedFilter === 'all' ? 'No scans yet' : `No scans in ${selectedFilter}`}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchText ? 'Try a different search term' : 'Start scanning QR codes to see them here!'}
          </Text>
          {searchText && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchText('')}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredScans}
          renderItem={renderScanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
            />
          }
        />
      )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  refreshText: {
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 15,
  },
  scanItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanItemHeader: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIconText: {
    fontSize: 18,
  },
  scanItemInfo: {
    flex: 1,
  },
  scanData: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scanDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#888',
  },
  scanItemActions: {
    alignItems: 'flex-end',
  },
  tapHint: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  clearSearchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 20,
  },
  clearSearchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ScanHistoryScreen;