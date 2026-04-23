import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ScrollView
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList, Member } from '../types'
import { COLORS } from '../constants'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePin'>

export default function ChangePinScreen({ navigation }: Props) {
  const { auth } = useAuth()
  const [nationalId, setNationalId] = useState<string | null>(null)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Ambil nationalId dengan fetch profile user saat ini
    const fetchProfile = async () => {
      try {
        const { data } = await api.get<Member>(`/members/${auth?.memberId}`)
        setNationalId(data.nationalId)
      } catch {
        Alert.alert('Error', 'Gagal memuat profil untuk proses verifikasi.')
      }
    }
    if (auth?.memberId) fetchProfile()
  }, [auth?.memberId])

  const handleSave = async () => {
    if (!nationalId) {
      Alert.alert('Gagal', 'Data profil (NIK) belum siap. Silakan tunggu sebentar.')
      return
    }

    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Gagal', 'Pastikan semua kolom PIN sudah diisi.')
      return
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      Alert.alert('Gagal', 'PIN Baru harus berupa 6 digit angka.')
      return
    }

    if (newPin !== confirmPin) {
      Alert.alert('Gagal', 'Konfirmasi PIN Baru tidak cocok.')
      return
    }

    if (currentPin === newPin) {
      Alert.alert('Gagal', 'PIN Baru tidak boleh sama dengan PIN Lama.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/member-auth/change-pin', {
        nationalId: nationalId,
        currentPin: currentPin,
        newPin: newPin,
      })
      Alert.alert('Berhasil', 'PIN kamu berhasil diperbarui!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err.response?.data?.message ?? 'Gagal mengubah PIN.'
      Alert.alert('Gagal', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
          
          <View style={styles.card}>
            <Text style={styles.title}>🔒 Ubah PIN Keamanan</Text>
            <Text style={styles.desc}>
              Untuk menjaga keamanan akun, secara berkala gantilah PIN kamu. PIN harus berisi 6 digit angka ajaib.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN Saat Ini</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan PIN lama"
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                value={currentPin}
                onChangeText={setCurrentPin}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN Baru (6 Digit Angka)</Text>
              <TextInput
                style={styles.input}
                placeholder="Buat PIN baru"
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                value={newPin}
                onChangeText={setNewPin}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konfirmasi PIN Baru</Text>
              <TextInput
                style={styles.input}
                placeholder="Tulis ulang PIN baru"
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                value={confirmPin}
                onChangeText={setConfirmPin}
              />
            </View>

            <TouchableOpacity 
              style={[styles.btn, submitting && styles.btnDisabled]} 
              onPress={handleSave}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.btnText}>Simpan PIN Baru</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 8 },
  desc: { fontSize: 13, color: COLORS.gray500, marginBottom: 24, lineHeight: 20 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: 10, padding: 14,
    fontSize: 16, color: COLORS.gray900,
    letterSpacing: 2,
  },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 12,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
})
