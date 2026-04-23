import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal,
  Animated, Easing, Platform,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList, LoanDetail, Installment } from '../types'
import { COLORS } from '../constants'
import api from '../lib/api'
import { fmtCurrency, fmtDate } from '../lib/utils'
import * as ImagePicker from 'expo-image-picker'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

type Props = NativeStackScreenProps<RootStackParamList, 'Tracking'>

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({
  installment,
  onConfirm,
  onClose,
  loading,
}: {
  installment: Installment
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.card}>
          {/* Icon */}
          <View style={modal.iconWrap}>
            <Text style={modal.icon}>💳</Text>
          </View>

          <Text style={modal.title}>Konfirmasi Pembayaran</Text>
          <Text style={modal.sub}>
            Cicilan ke-<Text style={modal.bold}>{installment.installmentNumber}</Text>
          </Text>

          {/* Detail baris */}
          <View style={modal.detailBox}>
            <View style={modal.detailRow}>
              <Text style={modal.detailKey}>Jatuh Tempo</Text>
              <Text style={modal.detailVal}>{fmtDate(installment.dueDate)}</Text>
            </View>
            <View style={modal.detailRow}>
              <Text style={modal.detailKey}>Jumlah Bayar</Text>
              <Text style={[modal.detailVal, modal.bold, { color: COLORS.primary }]}>
                {fmtCurrency(installment.amountToPay)}
              </Text>
            </View>
          </View>

          {/* Info Bayar */}
          <View style={modal.infoBox}>
            <Text style={modal.infoTitle}>📋 Instruksi</Text>
            <Text style={modal.infoText}>Transfer {fmtCurrency(installment.amountToPay + (installment as any).penaltyAmount || 0)} ke BCA 1234567890.</Text>
          </View>

          {/* Tombol Pay (yang akan minta gambar) */}

          {/* Buttons */}
          <View style={modal.btnRow}>
            <TouchableOpacity style={modal.btnCancel} onPress={onClose} disabled={loading}>
              <Text style={modal.btnCancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.btnConfirm, loading && { opacity: 0.6 }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : <Text style={modal.btnConfirmText}>✅ Konfirmasi Bayar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── Installment Row ───────────────────────────────────────────────────────────
function InstallmentRow({
  inst,
  isNext,
  onPay,
  onPrint,
}: {
  inst: Installment
  isNext: boolean
  onPay: (inst: Installment) => void
  onPrint: (inst: Installment) => void
}) {
  const isPaid    = inst.isPaid
  const isOverdue = inst.isOverdue && !isPaid

  const bg    = isPaid    ? COLORS.successLight
              : isOverdue ? COLORS.dangerLight
              : isNext    ? COLORS.primaryLight
              :             COLORS.white

  const borderL = isPaid    ? COLORS.success
                : isOverdue ? COLORS.danger
                : isNext    ? COLORS.primary
                :             COLORS.gray200

  return (
    <View style={[row.wrap, { backgroundColor: bg, borderLeftColor: borderL }]}>
      <View style={row.left}>
        {/* Nomor cicilan circle */}
        <View style={[row.numCircle, {
          backgroundColor: isPaid ? COLORS.success : isOverdue ? COLORS.danger : isNext ? COLORS.primary : COLORS.gray200
        }]}>
          <Text style={row.numText}>{inst.installmentNumber}</Text>
        </View>
        <View style={row.info}>
          <Text style={row.date}>{fmtDate(inst.dueDate)}</Text>
          {isPaid && inst.paidAt && (
            <Text style={row.subdate}>Dibayar {fmtDate(inst.paidAt)}</Text>
          )}
          {isOverdue && <Text style={row.overdueTxt}>⚠ Jatuh tempo melewati batas!</Text>}
          {isNext && !isPaid && <Text style={row.nextTxt}>← Cicilan bulan ini</Text>}
        </View>
      </View>

      <View style={row.right}>
        <Text style={[row.amount, isPaid && { color: COLORS.success }]}>
          {fmtCurrency(inst.amountToPay + (isPaid ? inst.penaltyAmount : 0))}
        </Text>
        {inst.penaltyAmount > 0 && !isPaid && (
          <Text style={{ fontSize: 10, color: COLORS.danger, fontWeight: '700', marginTop: 2, textAlign: 'right' }}>
            + Denda Rp {fmtCurrency(inst.penaltyAmount).replace('Rp', '')}
          </Text>
        )}

        {/* Status badge */}
        {isPaid ? (
          <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
            <View style={[row.badge, row.badgePaid]}>
              <Text style={[row.badgeText, { color: '#065F46' }]}>✓ Lunas</Text>
            </View>
            <TouchableOpacity onPress={() => onPrint(inst)} style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#C7D2FE' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.primary }}>📥 Cetak Struk</Text>
            </TouchableOpacity>
          </View>
        ) : !!inst.receiptUrl ? (
          <View style={[row.badge, row.badgePending]}>
            <Text style={[row.badgeText, { color: COLORS.gray500 }]}>⏳ Verifikasi</Text>
          </View>
        ) : isNext ? (
          <TouchableOpacity
            style={[row.badge, row.badgePay]}
            onPress={() => onPay(inst)}
            activeOpacity={0.8}>
            <Text style={[row.badgeText, { color: COLORS.white }]}>Upload Struk</Text>
          </TouchableOpacity>
        ) : isOverdue ? (
          <TouchableOpacity
            style={[row.badge, row.badgeOverdue]}
            onPress={() => onPay(inst)}
            activeOpacity={0.8}>
            <Text style={[row.badgeText, { color: COLORS.white }]}>Bayar Denda</Text>
          </TouchableOpacity>
        ) : (
          <View style={[row.badge, row.badgePending]}>
            <Text style={[row.badgeText, { color: COLORS.gray500 }]}>Menunggu</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ─── Empty / No Active Loan ────────────────────────────────────────────────────
function EmptyState({ onApply }: { onApply: () => void }) {
  const float = new Animated.Value(0)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0,  duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={empty.wrap}>
      <Animated.Text style={[empty.illustration, { transform: [{ translateY: float }] }]}>
        🏦
      </Animated.Text>
      <Text style={empty.title}>Belum Ada Pinjaman Aktif</Text>
      <Text style={empty.sub}>
        Kamu belum memiliki pinjaman aktif saat ini.{'\n'}
        Ajukan pinjaman pertamamu sekarang!
      </Text>
      <TouchableOpacity style={empty.btn} onPress={onApply} activeOpacity={0.85}>
        <Text style={empty.btnText}>💰 Ajukan Pinjaman</Text>
      </TouchableOpacity>
      <Text style={empty.note}>Limit: Rp 500.000 – Rp 10.000.000</Text>
    </View>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function TrackingScreen({ route, navigation }: Props) {
  const { loanId } = route.params
  const [loan,       setLoan]       = useState<LoanDetail | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refresh,    setRefresh]    = useState(false)
  const [payTarget,  setPayTarget]  = useState<Installment | null>(null)
  const [paying,     setPaying]     = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<LoanDetail>(`/loans/${loanId}`)
      setLoan(data)
    } catch {
      Alert.alert('Error', 'Gagal memuat data pinjaman.')
      navigation.goBack()
    } finally {
      setLoading(false)
      setRefresh(false)
    }
  }, [loanId])

  useEffect(() => { load() }, [load])
  const onRefresh = () => { setRefresh(true); load() }

  // ── Kalkulasi ringkasan ──────────
  const paidInstallments   = loan?.installments.filter(i => i.isPaid)  ?? []
  const unpaidInstallments = loan?.installments.filter(i => !i.isPaid) ?? []
  const nextInstallment    = unpaidInstallments[0] ?? null   // cicilan paling dekat jatuh tempo
  const totalPaid          = paidInstallments.reduce((s, i) => s + i.amountToPay, 0)
  const totalRemaining     = unpaidInstallments.reduce((s, i) => s + i.amountToPay, 0)
  const progress           = loan
    ? paidInstallments.length / loan.installments.length
    : 0

  // ── Proses bayar dengan Upload Gambar ────────────────
  const handlePay = async () => {
    if (!payTarget) return

    // Minta izin akses galeri
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      Alert.alert('Izin ditolak', 'Kamu harus memberikan izin akses galeri foto untuk mengunggah bukti pembayaran!')
      return
    }

    // Buka galeri
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (pickerResult.canceled) {
      return // Dibatalkan oleh user
    }

    setPaying(true)
    try {
      const img = pickerResult.assets[0]
      const formData = new FormData()
      
      const fileSplit = img.uri.split('/')
      const fileName = fileSplit[fileSplit.length - 1]
      const match = /\.(\w+)$/.exec(fileName)
      const type = match ? `image/${match[1]}` : `image`

      formData.append('file', {
        uri: img.uri,
        name: fileName,
        type: type
      } as any)

      await api.post(`/loans/installments/${payTarget.id}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // Penting untuk mengirim file
      })

      setPayTarget(null)
      load()
      Alert.alert(
        '🎉 Bukti Terkirim!',
        `Bukti cicilan ke-${payTarget.installmentNumber} sedang menunggu verifikasi Admin.`
      )
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.detail ?? 'Gagal mengunggah bukti.')
    } finally {
      setPaying(false)
    }
  }

  // ── Print Kwitansi ──────────────────────────────────
  const handlePrint = async (inst: Installment) => {
    if (!loan) return
    try {
      const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #4F46E5; margin: 0; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            .box { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: #f9f9f9; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .row strong { color: #111; }
            .stamp { text-align: center; margin-top: 30px; }
            .stamp span { display: inline-block; padding: 10px 20px; border: 3px solid #059669; color: #059669; font-size: 20px; font-weight: bold; border-radius: 8px; transform: rotate(-5deg); }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">KoperasiQu</h1>
            <p class="subtitle">Bukti Pembayaran Cicilan Resmi</p>
          </div>
          
          <div class="box">
            <div class="row"><span>Tanggal Bayar:</span> <strong>${fmtDate(inst.paidAt || new Date().toISOString())}</strong></div>
            <div class="row"><span>ID Pinjaman:</span> <strong>${loan.id.slice(0, 8).toUpperCase()}</strong></div>
            <div class="row"><span>Cicilan Ke:</span> <strong>${inst.installmentNumber} dari ${loan.installments.length}</strong></div>
            <div class="row"><span>Nominal Dibayar:</span> <strong style="font-size: 18px; color: #4F46E5;">${fmtCurrency(inst.amountPaid || inst.amountToPay + (inst.penaltyAmount || 0))}</strong></div>
          </div>

          <div class="stamp">
            <span>✅ LUNAS</span>
          </div>

          <div class="footer">
            <p>Kwitansi ini diterbitkan secara otomatis oleh sistem KoperasiQu dan sah tanpa tanda tangan.</p>
          </div>
        </body>
      </html>
      `
      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Bagikan Kwitansi' })
    } catch (err) {
      Alert.alert('Error', 'Gagal membuat file kwitansi PDF.')
    }
  }

  // ── Loading state ────────────────
  if (loading) return (
    <View style={s.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  )

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Tracking Pinjaman</Text>
          <Text style={s.headerSub}>Pantau & bayar cicilan kamu</Text>
        </View>

        {/* ══════════════════════════════════════
            LOAN SUMMARY CARD
        ══════════════════════════════════════ */}
        {loan && (
          <View style={s.summaryCard}>
            {/* Status + jumlah */}
            <View style={s.summaryTop}>
              <View>
                <Text style={s.summaryLabel}>Total Pinjaman</Text>
                <Text style={s.summaryAmount}>{fmtCurrency(loan.amount)}</Text>
              </View>
              <View style={s.statusPill}>
                <Text style={s.statusPillText}>
                  {loan.status === 'Active' ? '🟢 Aktif' : loan.status}
                </Text>
              </View>
            </View>

            {/* Progress bar cicilan */}
            <View style={s.progressSection}>
              <View style={s.progressLabelRow}>
                <Text style={s.progressLabelLeft}>
                  {paidInstallments.length}/{loan.installments.length} cicilan terbayar
                </Text>
                <Text style={s.progressLabelRight}>{Math.round(progress * 100)}%</Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
              </View>
            </View>

            {/* 3 stat box */}
            <View style={s.statRow}>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Total Bayar</Text>
                <Text style={s.statValue}>{fmtCurrency(loan.totalAmountDue)}</Text>
              </View>
              <View style={[s.statBox, s.statBoxMid]}>
                <Text style={s.statLabel}>Sudah Dibayar</Text>
                <Text style={[s.statValue, { color: COLORS.success }]}>{fmtCurrency(totalPaid)}</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Sisa Hutang</Text>
                <Text style={[s.statValue, { color: COLORS.danger }]}>{fmtCurrency(totalRemaining)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════
            NEXT PAYMENT CTA (bila ada cicilan)
        ══════════════════════════════════════ */}
        {nextInstallment && (
          <View style={s.ctaCard}>
            <View style={s.ctaLeft}>
              <Text style={s.ctaLabel}>
                {nextInstallment.isOverdue ? '🔴 Jatuh Tempo Terlewat!' : '📅 Cicilan Berikutnya'}
              </Text>
              <Text style={s.ctaDate}>{fmtDate(nextInstallment.dueDate)}</Text>
              <Text style={s.ctaAmount}>{fmtCurrency(nextInstallment.amountToPay)}</Text>
            </View>
            <TouchableOpacity
              style={[s.ctaBtn, nextInstallment.isOverdue && s.ctaBtnOverdue]}
              onPress={() => setPayTarget(nextInstallment)}
              activeOpacity={0.85}>
              <Text style={s.ctaBtnText}>💳 Bayar{'\n'}Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════
            INSTALLMENT LIST
        ══════════════════════════════════════ */}
        {loan && loan.installments.length > 0 && (
          <View style={s.installSection}>
            <Text style={s.sectionTitle}>Jadwal Cicilan</Text>
            <Text style={s.sectionSub}>
              Gesek ke atas untuk melihat semua {loan.installments.length} cicilan
            </Text>

            {loan.installments.map(inst => (
              <InstallmentRow
                key={inst.id}
                inst={inst}
                isNext={inst.id === nextInstallment?.id}
                onPay={target => setPayTarget(target)}
                onPrint={handlePrint}
              />
            ))}
          </View>
        )}

        {/* ══════════════════════════════════════
            LOAN DETAILS
        ══════════════════════════════════════ */}
        {loan && (
          <View style={s.detailCard}>
            <Text style={s.sectionTitle}>Info Pinjaman</Text>
            {[
              ['Tenor',         `${loan.tenorMonths} bulan`],
              ['Bunga',         `${loan.interestRatePerMonth}% /bulan (flat)`],
              ['Total Bunga',   fmtCurrency(loan.totalInterest)],
              ['Cicilan/Bln',   fmtCurrency(loan.monthlyInstallment)],
              ['Tgl Cair',      fmtDate(loan.disbursementDate)],
              ['Tujuan',        loan.purpose ?? '-'],
            ].map(([k, v]) => (
              <View key={k} style={s.detailRow}>
                <Text style={s.detailKey}>{k}</Text>
                <Text style={s.detailVal}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── PAYMENT MODAL ── */}
      {payTarget && (
        <PaymentModal
          installment={payTarget}
          loading={paying}
          onConfirm={handlePay}
          onClose={() => setPayTarget(null)}
        />
      )}
    </>
  )
}

// ─── Styles per section ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.gray50 },
  scroll:           { paddingBottom: 48 },
  loading:          { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:           { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitle:      { fontSize: 24, fontWeight: '800', color: COLORS.gray900, letterSpacing: -0.5 },
  headerSub:        { fontSize: 13, color: COLORS.gray400, marginTop: 3 },

  // Summary Card
  summaryCard:      {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 20,
    backgroundColor: COLORS.primary, padding: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  summaryTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  summaryLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  summaryAmount:    { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  statusPill:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillText:   { fontSize: 12, fontWeight: '600', color: COLORS.white },

  // Progress
  progressSection:  { marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabelLeft:{ fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  progressLabelRight:{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  progressBg:       { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' },
  progressFill:     { height: '100%', backgroundColor: COLORS.white, borderRadius: 99 },

  // Stat Row
  statRow:          { flexDirection: 'row', gap: 8 },
  statBox:          { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 },
  statBoxMid:       { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statLabel:        { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue:        { fontSize: 13, fontWeight: '800', color: COLORS.white },

  // CTA Card
  ctaCard:          {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16,
    backgroundColor: COLORS.white, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  ctaLeft:          { flex: 1 },
  ctaLabel:         { fontSize: 11, color: COLORS.gray500, fontWeight: '600', marginBottom: 4 },
  ctaDate:          { fontSize: 12, color: COLORS.gray400, marginBottom: 2 },
  ctaAmount:        { fontSize: 20, fontWeight: '900', color: COLORS.gray900 },
  ctaBtn:           {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    marginLeft: 12,
  },
  ctaBtnOverdue:    { backgroundColor: COLORS.danger },
  ctaBtnText:       { fontSize: 12, fontWeight: '800', color: COLORS.white, textAlign: 'center', lineHeight: 18 },

  // Installment Section
  installSection:   { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  sectionSub:       { fontSize: 11, color: COLORS.gray400, marginBottom: 12 },

  // Detail Card
  detailCard:       {
    marginHorizontal: 16, borderRadius: 16, backgroundColor: COLORS.white,
    padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  detailRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  detailKey:        { fontSize: 12, color: COLORS.gray500 },
  detailVal:        { fontSize: 12, fontWeight: '600', color: COLORS.gray900 },
})

// ─── Installment Row Styles ────────────────────────────────────────────────────
const row = StyleSheet.create({
  wrap:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderLeftWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  left:        { flexDirection: 'row', alignItems: 'center', flex: 1 },
  numCircle:   {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  numText:     { fontSize: 13, fontWeight: '800', color: COLORS.white },
  info:        { flex: 1 },
  date:        { fontSize: 12, fontWeight: '600', color: COLORS.gray900 },
  subdate:     { fontSize: 10, color: COLORS.success, marginTop: 1 },
  overdueTxt:  { fontSize: 10, color: COLORS.danger, fontWeight: '600', marginTop: 1 },
  nextTxt:     { fontSize: 10, color: COLORS.primary, fontWeight: '600', marginTop: 1 },
  right:       { alignItems: 'flex-end', gap: 6 },
  amount:      { fontSize: 13, fontWeight: '800', color: COLORS.gray900 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePaid:   { backgroundColor: COLORS.successLight },
  badgePay:    { backgroundColor: COLORS.primary },
  badgeOverdue:{ backgroundColor: COLORS.danger },
  badgePending:{ backgroundColor: COLORS.gray100 },
  badgeText:   { fontSize: 10, fontWeight: '700' },
})

// ─── Modal Styles ──────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay:     {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card:        {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 24,
    width: '100%', maxWidth: 400,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  iconWrap:    { alignItems: 'center', marginBottom: 12 },
  icon:        { fontSize: 40 },
  title:       { fontSize: 18, fontWeight: '800', color: COLORS.gray900, textAlign: 'center', marginBottom: 4 },
  sub:         { fontSize: 13, color: COLORS.gray500, textAlign: 'center', marginBottom: 16 },
  bold:        { fontWeight: '800' },
  detailBox:   {
    backgroundColor: COLORS.gray50, borderRadius: 12, padding: 14,
    gap: 8, marginBottom: 16,
  },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  detailKey:   { fontSize: 13, color: COLORS.gray500 },
  detailVal:   { fontSize: 13, fontWeight: '600', color: COLORS.gray900 },
  infoBox:     {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
    marginBottom: 20, borderLeftWidth: 3, borderLeftColor: COLORS.secondary,
  },
  infoTitle:   { fontSize: 12, fontWeight: '700', color: '#1E40AF', marginBottom: 6 },
  infoText:    { fontSize: 11, color: '#1E40AF', lineHeight: 18, marginBottom: 4 },
  btnRow:      { flexDirection: 'row', gap: 10 },
  btnCancel:   {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.gray200, alignItems: 'center',
  },
  btnCancelText:   { fontSize: 14, fontWeight: '600', color: COLORS.gray700 },
  btnConfirm:  {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  btnConfirmText:  { fontSize: 14, fontWeight: '800', color: COLORS.white },
})

// ─── Empty State Styles ────────────────────────────────────────────────────────
const empty = StyleSheet.create({
  wrap:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  illustration: { fontSize: 80, marginBottom: 24 },
  title:        { fontSize: 20, fontWeight: '800', color: COLORS.gray700, marginBottom: 10, textAlign: 'center' },
  sub:          { fontSize: 14, color: COLORS.gray400, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn:          {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnText:      { fontSize: 15, fontWeight: '800', color: COLORS.white },
  note:         { fontSize: 11, color: COLORS.gray400, marginTop: 12 },
})
