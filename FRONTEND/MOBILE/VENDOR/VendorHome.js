import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../components/ThemeComponents/ThemeContext'
import UserStorageService from '../services/UserStorageService'

const VendorHome = ({ navigation }) => {
  const { theme, isDark } = useTheme()
  const [vendorData, setVendorData] = useState(null)

  useEffect(() => {
    loadVendorData()
  }, [])

  const loadVendorData = async () => {
    const data = await UserStorageService.getUserData()
    setVendorData(data)
  }

  const handleLogout = async () => {
    await UserStorageService.clearUserData()
    navigation.navigate('LoginScreen')
  }

  const vendor = vendorData?.vendor
  const business = vendorData?.business

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.text }]}>Vendor Portal</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Account Overview</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#ffffff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Vendor Profile</Text>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{vendor?.full_name || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{vendor?.email || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Contact</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{vendor?.contact_number || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Address</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{vendor?.address || 'N/A'}</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Business Information</Text>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Business Name</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{business?.business_name || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Business Type</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{business?.business_type || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Products</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{business?.products || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}> {business?.business_description || 'N/A'} </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
})

export default VendorHome