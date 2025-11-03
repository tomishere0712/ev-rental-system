import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { stationService, Station } from '../../services/stationService';

const { width, height } = Dimensions.get('window');

const StationListScreen = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await stationService.getAll();
      setStations(data);
    } catch (error: any) {
      console.error('Load stations error:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách điểm thuê');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStations();
    setRefreshing(false);
  };

  const openMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const renderStationCard = ({ item }: { item: Station }) => {
    const address = `${item.address.street}, ${item.address.district}, ${item.address.city}`;
    
    // Handle operatingHours - support both formats
    let hours = 'N/A';
    if (item.operatingHours) {
      if (item.operatingHours.open && item.operatingHours.close) {
        hours = `${item.operatingHours.open} - ${item.operatingHours.close}`;
      } else if (item.operatingHours.monday) {
        hours = `${item.operatingHours.monday.open} - ${item.operatingHours.monday.close}`;
      }
    }
    
    // Get coordinates - support both old and new format
    const lat = item.coordinates?.lat || item.location?.coordinates?.[1] || 0;
    const lng = item.coordinates?.lng || item.location?.coordinates?.[0] || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedStation(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={24} color="#10B981" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.stationName}>{item.name}</Text>
            <Text style={styles.stationCode}>Mã: {item.code}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={2}>
              {address}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{hours}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{item.contactPhone || item.phone}</Text>
          </View>

          {item.facilities && item.facilities.length > 0 && (
            <View style={styles.facilitiesContainer}>
              {item.facilities.slice(0, 3).map((facility, index) => (
                <View key={index} style={styles.facilityTag}>
                  <Text style={styles.facilityText}>{facility}</Text>
                </View>
              ))}
              {item.facilities.length > 3 && (
                <View style={styles.facilityTag}>
                  <Text style={styles.facilityText}>+{item.facilities.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openMaps(lat, lng, item.name)}
          >
            <Ionicons name="map-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Chỉ đường</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bicycle-outline" size={18} color="#10B981" />
            <Text style={styles.actionButtonText}>Xem xe</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải điểm thuê...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Điểm thuê</Text>
            <Text style={styles.headerSubtitle}>
              {stations.length} điểm thuê trên toàn quốc
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            <Ionicons
              name={viewMode === 'list' ? 'map' : 'list'}
              size={24}
              color="#3B82F6"
            />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 21.0285,
            longitude: 105.8542,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          {stations.map((station) => {
            // Get coordinates - support both old and new format
            const lat = station.coordinates?.lat || station.location?.coordinates?.[1];
            const lng = station.coordinates?.lng || station.location?.coordinates?.[0];
            
            if (!lat || !lng) return null;
            
            return (
              <Marker
                key={station._id}
                coordinate={{ latitude: lat, longitude: lng }}
                title={station.name}
                description={`${station.address.street}, ${station.address.district}`}
                onPress={() => setSelectedStation(station)}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="location" size={32} color="#10B981" />
                </View>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        <FlatList
          data={stations}
          renderItem={renderStationCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có điểm thuê nào</Text>
            </View>
          }
        />
      )}

      {selectedStation && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedCardHeader}>
            <Text style={styles.selectedStationName}>{selectedStation.name}</Text>
            <TouchableOpacity onPress={() => setSelectedStation(null)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedAddress}>
            {selectedStation.address.street}, {selectedStation.address.district}
          </Text>
          <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.selectedActionButton}
              onPress={() => {
                // Get coordinates - support both formats
                const lat = selectedStation.coordinates?.lat || selectedStation.location?.coordinates?.[1];
                const lng = selectedStation.coordinates?.lng || selectedStation.location?.coordinates?.[0];
                
                if (lat && lng) {
                  openMaps(lat, lng, selectedStation.name);
                }
              }}
            >
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
              <Text style={styles.selectedActionText}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  stationCode: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  facilityTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  facilityText: {
    fontSize: 12,
    color: '#4F46E5',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  selectedCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedStationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  selectedAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  selectedActions: {
    flexDirection: 'row',
  },
  selectedActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedActionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default StationListScreen;
