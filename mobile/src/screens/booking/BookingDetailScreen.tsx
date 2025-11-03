import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingService, Booking } from '../../services/bookingService';

export default function BookingDetailScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getById(bookingId);
      setBooking(data);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn thuê');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc muốn hủy đơn thuê này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await bookingService.cancel(bookingId, 'Khách hàng hủy');
              Alert.alert('Thành công', 'Đã hủy đơn thuê');
              await loadBooking();
            } catch (error: any) {
              Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể hủy đơn'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckIn = () => {
    Alert.alert(
      'Check-in',
      'Chức năng check-in sẽ được thêm vào phiên bản sau',
      [{ text: 'OK' }]
    );
  };

  const handleRequestReturn = () => {
    Alert.alert(
      'Yêu cầu trả xe',
      'Bạn muốn trả xe sớm hơn dự định?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Yêu cầu trả xe',
          onPress: async () => {
            try {
              setActionLoading(true);
              await bookingService.requestReturn(bookingId, {});
              Alert.alert(
                'Thành công',
                'Yêu cầu trả xe đã được gửi. Vui lòng đến điểm trả xe.'
              );
              await loadBooking();
            } catch (error: any) {
              Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể gửi yêu cầu'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'in-progress':
        return '#34C759';
      case 'completed':
        return '#8E8E93';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'in-progress':
        return 'Đang thuê';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Không tìm thấy đơn thuê</Text>
      </View>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canCheckIn = booking.status === 'confirmed';
  const canRequestReturn = booking.status === 'in-progress';

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.bookingNumber}>#{booking.bookingNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(booking.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(booking.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin xe</Text>
          <View style={styles.vehicleCard}>
            <Image
              source={{
                uri:
                  booking.vehicle?.images?.[0] ||
                  'https://via.placeholder.com/120x90?text=No+Image',
              }}
              style={styles.vehicleImage}
            />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {booking.vehicle?.name || 'N/A'}
              </Text>
              <Text style={styles.vehicleModel}>
                {booking.vehicle?.brand} {booking.vehicle?.model}
              </Text>
              <View style={styles.plateContainer}>
                <Ionicons name="speedometer-outline" size={16} color="#666" />
                <Text style={styles.plateText}>
                  {booking.vehicle?.licensePlate}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rental Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian thuê</Text>
          <View style={styles.card}>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                <Text style={styles.dateLabel}>Ngày nhận xe</Text>
                <Text style={styles.dateValue}>
                  {formatDate(booking.startDate)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#ccc" />
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                <Text style={styles.dateLabel}>Ngày trả xe</Text>
                <Text style={styles.dateValue}>
                  {formatDate(booking.endDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điểm thuê/trả</Text>
          <View style={styles.card}>
            <View style={styles.stationRow}>
              <Ionicons name="location" size={20} color="#34C759" />
              <View style={styles.stationInfo}>
                <Text style={styles.stationLabel}>Điểm nhận xe</Text>
                <Text style={styles.stationName}>
                  {booking.pickupStation?.name || 'N/A'}
                </Text>
                {booking.pickupStation?.address && (
                  <Text style={styles.stationAddress}>
                    {booking.pickupStation.address}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.stationRow}>
              <Ionicons name="location" size={20} color="#FF3B30" />
              <View style={styles.stationInfo}>
                <Text style={styles.stationLabel}>Điểm trả xe</Text>
                <Text style={styles.stationName}>
                  {booking.returnStation?.name || 'N/A'}
                </Text>
                {booking.returnStation?.address && (
                  <Text style={styles.stationAddress}>
                    {booking.returnStation.address}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi phí</Text>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá thuê</Text>
              <Text style={styles.priceValue}>
                {formatPrice(booking.pricing?.basePrice || 0)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tiền đặt cọc</Text>
              <Text style={styles.priceValue}>
                {formatPrice(booking.pricing?.deposit || 0)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {formatPrice(booking.pricing?.totalAmount || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={styles.card}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Phương thức</Text>
                <Text style={styles.paymentValue}>
                  {booking.payment?.method === 'vnpay'
                    ? 'VNPay'
                    : booking.payment?.method || 'N/A'}
                </Text>
              </View>
              <View
                style={[
                  styles.paymentStatusBadge,
                  {
                    backgroundColor:
                      booking.payment?.status === 'completed'
                        ? '#34C759'
                        : '#FF9500',
                  },
                ]}
              >
                <Text style={styles.paymentStatusText}>
                  {booking.payment?.status === 'completed'
                    ? 'Đã thanh toán'
                    : 'Chưa thanh toán'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {(canCancel || canCheckIn || canRequestReturn) && (
        <View style={styles.actionBar}>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FF3B30" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                  <Text style={styles.cancelButtonText}>Hủy đơn</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canCheckIn && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCheckIn}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Check-in</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canRequestReturn && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRequestReturn}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="return-down-back-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Yêu cầu trả xe</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vehicleImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {},
  paymentLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paymentStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});
