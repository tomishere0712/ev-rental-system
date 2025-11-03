import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleService, Vehicle } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';

const { width } = Dimensions.get('window');

export default function VehicleDetailScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getById(vehicleId);
      setVehicle(data);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin xe');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!vehicle) return;

    Alert.alert(
      'Xác nhận thuê xe',
      `Bạn muốn thuê ${vehicle.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thuê ngay',
          onPress: () => navigation.navigate('BookingCreate', { vehicle }),
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Không tìm thấy xe</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                vehicle.images?.[selectedImage] ||
                'https://via.placeholder.com/400x300?text=No+Image',
            }}
            style={styles.mainImage}
          />
          {vehicle.images && vehicle.images.length > 1 && (
            <View style={styles.thumbnailContainer}>
              {vehicle.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(index)}
                >
                  <Image
                    source={{ uri: img }}
                    style={[
                      styles.thumbnail,
                      selectedImage === index && styles.thumbnailActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              vehicle.status === 'available'
                ? styles.statusAvailable
                : styles.statusUnavailable,
            ]}
          >
            <Text style={styles.statusText}>
              {vehicle.status === 'available' ? 'Sẵn sàng' : 'Không khả dụng'}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{vehicle.name}</Text>
          <Text style={styles.subtitle}>
            {vehicle.brand} {vehicle.model}
          </Text>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="pricetag" size={20} color="#007AFF" />
              <Text style={styles.quickInfoLabel}>Loại xe</Text>
              <Text style={styles.quickInfoValue}>{vehicle.type}</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="speedometer" size={20} color="#007AFF" />
              <Text style={styles.quickInfoLabel}>Biển số</Text>
              <Text style={styles.quickInfoValue}>{vehicle.licensePlate}</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="battery-charging" size={20} color="#007AFF" />
              <Text style={styles.quickInfoLabel}>Pin</Text>
              <Text style={styles.quickInfoValue}>
                {vehicle.batteryCapacity}%
              </Text>
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Ionicons name="flash" size={24} color="#007AFF" />
                <Text style={styles.specLabel}>Tốc độ tối đa</Text>
                <Text style={styles.specValue}>
                  {vehicle.specifications.topSpeed} km/h
                </Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="navigate" size={24} color="#007AFF" />
                <Text style={styles.specLabel}>Quãng đường</Text>
                <Text style={styles.specValue}>{vehicle.range} km</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="time" size={24} color="#007AFF" />
                <Text style={styles.specLabel}>Sạc đầy</Text>
                <Text style={styles.specValue}>
                  {vehicle.specifications.chargingTime}h
                </Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="barbell" size={24} color="#007AFF" />
                <Text style={styles.specLabel}>Trọng lượng</Text>
                <Text style={styles.specValue}>
                  {vehicle.specifications.weight} kg
                </Text>
              </View>
            </View>
          </View>

          {/* Station Info */}
          {vehicle.station && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Điểm thuê</Text>
              <View style={styles.stationCard}>
                <Ionicons name="location" size={24} color="#007AFF" />
                <View style={styles.stationInfo}>
                  <Text style={styles.stationName}>{vehicle.station.name}</Text>
                  <TouchableOpacity>
                    <Text style={styles.viewMapText}>Xem bản đồ →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giá thuê</Text>
            <View style={styles.pricingCard}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Giá theo ngày</Text>
                <Text style={styles.pricingValue}>
                  {formatPrice(vehicle.pricePerDay)}/ngày
                </Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Giá theo tuần</Text>
                <Text style={styles.pricingValue}>
                  {formatPrice(vehicle.pricePerDay * 7 * 0.9)}/tuần
                </Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Giá theo tháng</Text>
                <Text style={styles.pricingValue}>
                  {formatPrice(vehicle.pricePerDay * 30 * 0.8)}/tháng
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      {vehicle.status === 'available' && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.priceLabel}>Từ</Text>
            <Text style={styles.priceValue}>
              {formatPrice(vehicle.pricePerDay)}/ngày
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBooking}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.bookButtonText}>Thuê xe ngay</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width,
    height: width * 0.75,
    backgroundColor: '#f0f0f0',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    opacity: 0.6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    opacity: 1,
    borderColor: '#fff',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusAvailable: {
    backgroundColor: '#34C759',
  },
  statusUnavailable: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickInfoItem: {
    alignItems: 'center',
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  specItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  specLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  specValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  viewMapText: {
    fontSize: 14,
    color: '#007AFF',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pricingLabel: {
    fontSize: 15,
    color: '#666',
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
