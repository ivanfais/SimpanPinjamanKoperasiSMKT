import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Keyboard,
  TouchableWithoutFeedback, Animated, Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList, Member } from '../types'
import { COLORS, TENOR_OPTIONS, MIN_LOAN, MAX_LOAN } from '../constants'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  fmtCurrency, fmtCurrencyInput, parseCurrencyInput, calcInstallment
} from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'ApplyLoan'>

// ─── Tenor Button ──────────────────────────────────────────────────────────────
function TenorButton({
  label, selected, onPress
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tenorBtn, selected && styles.tenorBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text style={[styles.tenorLabel, selected && styles.tenorLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── LiveCalc Card ─────────────────────────────────────────────────────────────
function CalcCard({ amount, tenor }: { amount: number; tenor: number }) {
  if (!amount || amount < MIN_LOAN) return null
  const { monthly, totalInterest, totalDue } = calcInstallment(amount, tenor)

  return (
    <View style={styles.calcCard}>
      <View style={styles.calcHeader}>
        <Text style={styles.calcTitle}>📊 Estimasi Pinjaman</Text>
        <Text style={styles.calcNote}>*Flat rate 1.5%/bulan</Text>
      </View>

      {/* Cicilan besar */}
      <View style={styles.calcHighlight}>
        <Text style={styles.calcMonthlyLabel}>Cicilan per Bulan</Text>
        <Text style={styles.calcMonthlyValue}>{fmtCurrency(monthly)}</Text>
        <Text style={styles.calcTenorNote}>selama {tenor} bulan</Text>
      </View>

      {/* Rincian */}
      <View style={styles.calcRows}>
        {[
          ['Pokok Pinjaman',  fmtCurrency(amount)],
          ['Total Bunga',     fmtCurrency(totalInterest)],
          ['Total Bayar',     fmtCurrency(totalDue)],
        ].map(([k, v]) => (
          <View key={k} style={styles.calcRow}>
            <Text style={styles.calcRowLabel}>{k}</Text>
            <Text style={[
              styles.calcRowValue,
              k === 'Total Bayar' && styles.calcRowValueBold
            ]}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ApplyLoanScreen({ navigation }: Props) {
  const { auth } = useAuth()
  const [member,       setMember]       = useState<Member | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [rawInput,     setRawInput]     = useState('')          // '1.000.000'
  const [amount,       setAmount]       = useState(0)           // numeric
  const [tenor,        setTenor]        = useState(6)
  const [purpose,      setPurpose]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  // Animasi error shake
  const shakeAnim = new Animated.Value(0)

  // ── Muat profil member ──
  const loadProfile = useCallback(async () => {
    if (!auth?.memberId) return
    try {
      const { data } = await api.get<Member>(`/members/${auth.memberId}`)
      setMember(data)
    } catch {
      Alert.alert('Error', 'Gagal memuat data profil.')
    } finally {
      setLoadingProfile(false)
    }
  }, [auth?.memberId])

  useEffect(() => { loadProfile() }, [loadProfile])

  // ── Validasi amount ──
  const getAmountError = (): string | null => {
    if (!rawInput) return null
    if (amount < MIN_LOAN)    return `Minimal pinjaman ${fmtCurrency(MIN_LOAN)}`
    if (amount > MAX_LOAN)    return `Maksimal pinjaman ${fmtCurrency(MAX_LOAN)}`
    if (member && amount > member.baseLimit)
      return `Melebihi batas kredit anda: ${fmtCurrency(member.baseLimit)}`
    return null
  }

  const amountError = getAmountError()
  const isAmountOk  = rawInput.length > 0 && !amountError

  // ── Handle input ──
  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '')
    const numeric    = Number(digitsOnly) || 0
    setAmount(numeric)
    setRawInput(digitsOnly ? fmtCurrencyInput(digitsOnly) : '')
  }

  // ── Shake animation ──
  const shake = () => {
    shakeAnim.setValue(0)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start()
  }

  // ── Submit ──
  const handleSubmit = async () => {
    if (!member) return

    if (member.hasActiveLoan) {
      Alert.alert('Tidak Dapat Mengajukan',
        'Kamu masih memiliki pinjaman aktif yang belum lunas.')
      return
    }

    if (amountError || !isAmountOk) { shake(); return }

    Alert.alert(
      'Konfirmasi Pengajuan',
      `Ajukan pinjaman ${fmtCurrency(amount)} selama ${tenor} bulan?\n\nCicilan/bulan: ${fmtCurrency(calcInstallment(amount, tenor).monthly)}`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ajukan Sekarang',
          onPress: async () => {
            setSubmitting(true)
            try {
              await api.post('/loans/apply', {
                memberId: auth!.memberId,
                amount,
                tenorMonths: tenor,
                purpose: purpose.trim() || null,
              })
              Alert.alert(
                '🎉 Pengajuan Berhasil!',
                'Pinjaman kamu sedang menunggu review Admin. Pantau statusnya di halaman "Pinjaman Saya".',
                [{ text: 'OK', onPress: () => navigation.replace('Dashboard') }]
              )
            } catch (err: any) {
              const msg = err.response?.data?.detail ?? 'Gagal mengajukan pinjaman.'
              Alert.alert('Gagal', msg)
            } finally {
              setSubmitting(false)
            }
          }
        }
      ]
    )
  }

  // ── Limit progress bar ──
  const limitProgress = member ? Math.min(amount / member.baseLimit, 1) : 0
  const limitPct      = Math.round(limitProgress * 100)

  if (loadingProfile) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ── HEADER ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ajukan Pinjaman</Text>
            <Text style={styles.headerSub}>Hai, {member?.name} 👋</Text>
          </View>

          {/* ── LIMIT INDICATOR ─────────────────────────── */}
          <View style={styles.limitCard}>
            <View style={styles.limitRow}>
              <View>
                <Text style={styles.limitLabel}>Batas Kredit Kamu</Text>
                <Text style={styles.limitValue}>
                  {member ? fmtCurrency(member.baseLimit) : '-'}
                </Text>
              </View>
              <View style={styles.limitBadge}>
                <Text style={styles.limitBadgeText}>💳</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressWrap}>
              <View style={styles.progressBg}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${limitPct}%` as `${number}%`,
                      backgroundColor: limitPct >= 100
                        ? COLORS.danger
                        : limitPct >= 85
                        ? COLORS.warning
                        : COLORS.success
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {rawInput
                  ? `${limitPct}% digunakan`
                  : `Maks ${fmtCurrency(member?.baseLimit ?? 0)}`}
              </Text>
            </View>

            {member?.hasActiveLoan && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>
                  ⚠️ Kamu masih memiliki pinjaman aktif. Lunasi terlebih dahulu.
                </Text>
              </View>
            )}
          </View>

          {/* ── NOMINAL INPUT ────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nominal Pinjaman</Text>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <View style={[
                styles.currencyWrap,
                amountError ? styles.currencyError :
                isAmountOk  ? styles.currencyOk    : styles.currencyDefault
              ]}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.gray400}
                  value={rawInput}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                {isAmountOk && (
                  <Text style={styles.validIcon}>✅</Text>
                )}
              </View>
            </Animated.View>

            {amountError ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>⚠️ {amountError}</Text>
              </View>
            ) : rawInput && isAmountOk ? (
              <Text style={styles.okText}>✓ Nominal valid</Text>
            ) : (
              <Text style={styles.inputHint}>
                Range: {fmtCurrency(MIN_LOAN)} – {fmtCurrency(MAX_LOAN)}
              </Text>
            )}
          </View>

          {/* ── TENOR SELECTOR ───────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pilih Tenor</Text>
            <View style={styles.tenorGrid}>
              {TENOR_OPTIONS.map(opt => (
                <TenorButton
                  key={opt.value}
                  label={opt.label}
                  selected={tenor === opt.value}
                  onPress={() => setTenor(opt.value)}
                />
              ))}
            </View>
          </View>

          {/* ── LIVE CALCULATION ─────────────────────────── */}
          <CalcCard amount={amount} tenor={tenor} />

          {/* ── TUJUAN PINJAMAN ──────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tujuan Pinjaman <Text style={styles.optional}>(Opsional)</Text>
            </Text>
            <TextInput
              style={styles.purposeInput}
              placeholder="Contoh: Modal usaha, renovasi rumah, pendidikan..."
              placeholderTextColor={COLORS.gray400}
              value={purpose}
              onChangeText={setPurpose}
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{purpose.length}/500</Text>
          </View>

          {/* ── SUBMIT BUTTON ─────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!isAmountOk || submitting || member?.hasActiveLoan) && styles.submitBtnDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isAmountOk || submitting || !!member?.hasActiveLoan}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Ajukan Sekarang 🚀</Text>
                {isAmountOk && (
                  <Text style={styles.submitBtnSub}>
                    {fmtCurrency(calcInstallment(amount, tenor).monthly)}/bln × {tenor} bln
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Pengajuan akan direview oleh admin koperasi. Status dapat dipantau di
            halaman "Pinjaman Saya".
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: COLORS.gray50 },
  scroll:            { padding: 20, paddingBottom: 40 },
  loadingWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:       { color: COLORS.gray500, fontSize: 14 },

  // Header
  header:            { marginBottom: 20 },
  headerTitle:       { fontSize: 26, fontWeight: '800', color: COLORS.gray900, letterSpacing: -0.5 },
  headerSub:         { fontSize: 14, color: COLORS.gray500, marginTop: 4 },

  // Limit Card
  limitCard:         {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 20,
    marginBottom: 20, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08,
    shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  limitRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  limitLabel:        { fontSize: 12, color: COLORS.gray500, fontWeight: '500', marginBottom: 4 },
  limitValue:        { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  limitBadge:        {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  limitBadgeText:    { fontSize: 22 },
  progressWrap:      { gap: 6 },
  progressBg:        { height: 8, backgroundColor: COLORS.gray100, borderRadius: 99, overflow: 'hidden' },
  progressFill:      { height: '100%', borderRadius: 99 },
  progressLabel:     { fontSize: 11, color: COLORS.gray500, textAlign: 'right' },
  warningBanner:     {
    marginTop: 12, backgroundColor: COLORS.warningLight,
    borderRadius: 10, padding: 10,
    borderLeftWidth: 3, borderLeftColor: COLORS.warning,
  },
  warningBannerText: { fontSize: 12, color: '#92400E', fontWeight: '500' },

  // Section
  section:           { marginBottom: 20 },
  sectionTitle:      { fontSize: 14, fontWeight: '700', color: COLORS.gray700, marginBottom: 12 },
  optional:          { color: COLORS.gray400, fontWeight: '400' },

  // Currency Input
  currencyWrap:      {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  currencyDefault:   { borderColor: COLORS.gray200 },
  currencyOk:        { borderColor: COLORS.success, backgroundColor: '#F0FDF4' },
  currencyError:     { borderColor: COLORS.danger,  backgroundColor: COLORS.dangerLight },
  currencyPrefix:    { fontSize: 16, fontWeight: '700', color: COLORS.gray500, marginRight: 8 },
  currencyInput:     { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.gray900 },
  validIcon:         { fontSize: 18 },
  errorRow:          { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  errorText:         { fontSize: 12, color: COLORS.danger, fontWeight: '500' },
  okText:            { fontSize: 12, color: COLORS.success, marginTop: 6, fontWeight: '500' },
  inputHint:         { fontSize: 11, color: COLORS.gray400, marginTop: 6 },

  // Tenor
  tenorGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tenorBtn:          {
    flex: 1, minWidth: '22%', paddingVertical: 12,
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.gray200,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, elevation: 1,
  },
  tenorBtnActive:    {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 6,
  },
  tenorLabel:        { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  tenorLabelActive:  { color: COLORS.white },

  // Live Calc Card
  calcCard:          {
    backgroundColor: COLORS.primary, borderRadius: 20, padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  calcHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calcTitle:         { fontSize: 14, fontWeight: '700', color: COLORS.white },
  calcNote:          { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  calcHighlight:     { alignItems: 'center', paddingVertical: 16, marginBottom: 16 },
  calcMonthlyLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  calcMonthlyValue:  { fontSize: 34, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  calcTenorNote:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  calcRows:          { gap: 8 },
  calcRow:           {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10,
  },
  calcRowLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  calcRowValue:      { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  calcRowValueBold:  { fontSize: 13, fontWeight: '800' },

  // Purpose
  purposeInput:      {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.gray200, padding: 14, fontSize: 14,
    color: COLORS.gray900, minHeight: 80,
  },
  charCount:         { fontSize: 11, color: COLORS.gray400, textAlign: 'right', marginTop: 4 },

  // Submit
  submitBtn:         {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    marginBottom: 16, gap: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText:     { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  submitBtnSub:      { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },

  disclaimer:        { fontSize: 11, color: COLORS.gray400, textAlign: 'center', lineHeight: 16 },
})
