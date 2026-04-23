import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, TextInput as RNTextInput
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList, MemberLoginResponse } from '../types'
import { COLORS } from '../constants'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

// ─── PIN Input (6 dot boxes) ───────────────────────────────────────────────────
function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<RNTextInput>(null)

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={styles.pinWrap}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[
          styles.pinBox,
          value.length === i && styles.pinBoxActive,
          value.length > i && styles.pinBoxFilled,
        ]}>
          <Text style={styles.pinDot}>{value[i] ? '●' : ''}</Text>
        </View>
      ))}
      {/* Hidden real input */}
      <RNTextInput
        ref={inputRef}
        style={styles.pinHidden}
        value={value}
        onChangeText={v => {
          const digits = v.replace(/\D/g, '').slice(0, 6)
          onChange(digits)
        }}
        keyboardType="numeric"
        maxLength={6}
        caretHidden
        autoFocus={false}
      />
    </TouchableOpacity>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth()
  const [nik,      setNik]      = useState('')
  const [pin,      setPin]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState<'nik' | 'pin'>('nik')

  const handleNikNext = () => {
    if (nik.trim().length !== 16 || !/^\d+$/.test(nik.trim())) {
      Alert.alert('NIK Tidak Valid', 'NIK harus 16 digit angka.')
      return
    }
    setStep('pin')
  }

  const handleLogin = async () => {
    if (pin.length < 6) {
      Alert.alert('PIN Tidak Lengkap', 'Masukkan 6 digit PIN kamu.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post<MemberLoginResponse>('/member-auth/login', {
        nationalId: nik.trim(),
        pin,
      })
      await login(
        data.memberId.toString(),
        data.name,
        data.token,
        data.baseLimit,
      )
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'NIK atau PIN salah.'
      Alert.alert('Login Gagal', msg)
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🏦</Text>
          </View>
          <Text style={styles.appName}>KoperasiQu</Text>
          <Text style={styles.appTagline}>Pinjaman Mudah, Proses Transparan</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* ── STEP 1: NIK ── */}
          {step === 'nik' && (
            <>
              <Text style={styles.cardTitle}>Masuk dengan NIK</Text>
              <Text style={styles.cardSub}>
                Masukkan 16 digit Nomor Induk Kependudukan (NIK) kamu
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Nomor NIK</Text>
                <TextInput
                  style={[styles.input, nik.length === 16 && styles.inputOk]}
                  placeholder="1234567890123456"
                  placeholderTextColor={COLORS.gray400}
                  value={nik}
                  onChangeText={v => setNik(v.replace(/\D/g, '').slice(0, 16))}
                  keyboardType="numeric"
                  maxLength={16}
                  returnKeyType="next"
                  onSubmitEditing={handleNikNext}
                />
                <View style={styles.nikProgress}>
                  <View style={[styles.nikBar, { width: `${(nik.length / 16) * 100}%` as `${number}%` }]} />
                </View>
                <Text style={styles.hint}>{nik.length}/16 digit</Text>
              </View>

              <TouchableOpacity
                style={[styles.btn, nik.length !== 16 && styles.btnDisabled]}
                onPress={handleNikNext}
                disabled={nik.length !== 16}
                activeOpacity={0.85}>
                <Text style={styles.btnText}>Lanjutkan →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 2: PIN ── */}
          {step === 'pin' && (
            <>
              <TouchableOpacity onPress={() => { setStep('nik'); setPin('') }} style={styles.backBtn}>
                <Text style={styles.backText}>← Ganti NIK</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Masukkan PIN</Text>
              <Text style={styles.cardSub}>
                NIK: <Text style={styles.nikDisplay}>****{nik.slice(-4)}</Text>
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>PIN 6 Digit</Text>
                <PinInput value={pin} onChange={setPin} />
                <Text style={styles.hint}>
                  💡 PIN default anggota baru: <Text style={{ fontWeight: '700' }}>123456</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.btn, (pin.length < 6 || loading) && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={pin.length < 6 || loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.btnText}>Masuk 🚀</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Lupa PIN? Hubungi admin koperasi</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Khusus untuk anggota koperasi terdaftar
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.primary },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24 },

  // Logo
  logoWrap:     { alignItems: 'center', marginBottom: 32 },
  logoCircle:   {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoIcon:     { fontSize: 36 },
  appName:      { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  appTagline:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  // Card
  card:         {
    backgroundColor: COLORS.white, borderRadius: 24,
    padding: 24, shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15,
    shadowRadius: 20, elevation: 12,
  },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  cardSub:      { fontSize: 13, color: COLORS.gray500, marginBottom: 24 },
  nikDisplay:   { color: COLORS.primary, fontWeight: '700' },

  // Back
  backBtn:      { marginBottom: 16 },
  backText:     { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Input
  inputWrap:    { marginBottom: 20 },
  label:        { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 8 },
  input:        {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 20, color: COLORS.gray900, letterSpacing: 4,
    backgroundColor: COLORS.gray50, fontWeight: '700',
  },
  inputOk:      { borderColor: COLORS.success, backgroundColor: '#F0FDF4' },
  nikProgress:  { height: 3, backgroundColor: COLORS.gray100, borderRadius: 99, overflow: 'hidden', marginTop: 6 },
  nikBar:       { height: '100%', backgroundColor: COLORS.primary, borderRadius: 99 },
  hint:         { fontSize: 11, color: COLORS.gray400, marginTop: 6 },

  // PIN
  pinWrap:      { flexDirection: 'row', gap: 10, justifyContent: 'center', position: 'relative', paddingVertical: 8 },
  pinBox:       {
    width: 44, height: 52, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    alignItems: 'center', justifyContent: 'center',
  },
  pinBoxActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  pinBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  pinDot:       { fontSize: 18, color: COLORS.primary },
  pinHidden:    { position: 'absolute', opacity: 0, width: 1, height: 1 },

  // Button
  btn:          {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled:  { opacity: 0.5 },
  btnText:      { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  // Forgot
  forgotBtn:    { alignItems: 'center', marginTop: 16 },
  forgotText:   { fontSize: 12, color: COLORS.gray400 },

  footer:       { textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 24, fontSize: 12 },
})
