import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const features = [
    {
      icon: 'bicycle',
      title: 'Thuê xe điện',
      description: 'Tìm và thuê xe điện gần bạn',
      color: '#3B82F6',
      onPress: () => navigation.navigate('Vehicles' as never),
    },
    {
      icon: 'list',
      title: 'Đơn thuê của tôi',
      description: 'Xem các đơn thuê hiện tại',
      color: '#10B981',
      onPress: () => navigation.navigate('Bookings' as never),
    },
    {
      icon: 'map',
      title: 'Điểm thuê',
      description: 'Tìm điểm thuê xe gần nhất',
      color: '#F59E0B',
      onPress: () => {},
    },
    {
      icon: 'person',
      title: 'Tài khoản',
      description: 'Quản lý thông tin cá nhân',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Profile' as never),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Guest'}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="notifications-outline" size={24} color="#1F2937" />
        </View>
      </View>

      <View style={styles.banner}>
        <Ionicons name="bicycle" size={60} color="#3B82F6" />
        <Text style={styles.bannerTitle}>Thuê xe điện</Text>
        <Text style={styles.bannerText}>Tiện lợi - Tiết kiệm - Thân thiện môi trường</Text>
      </View>

      <View style={styles.features}>
        <Text style={styles.sectionTitle}>Dịch vụ</Text>
        <View style={styles.grid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={feature.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={32} color={feature.color} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.sectionTitle}>Thống kê</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Chuyến đi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0 km</Text>
            <Text style={styles.statLabel}>Quãng đường</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0đ</Text>
            <Text style={styles.statLabel}>Tổng chi</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    backgroundColor: '#EFF6FF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  bannerText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  features: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  featureCard: {
    width: '50%',
    padding: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  stats: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default HomeScreen;
