import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList, LoanDetail } from '../types'
import { COLORS } from '../constants'
import api from '../lib/api'
import { fmtCurrency, fmtDate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'LoanDetail'>

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  Pending:   { label: '⏳ Menunggu Persetujuan', color: '#92400E', bg: '#FEF3C7' },
  Active:    { label: '✅ Aktif',                color: '#065F46', bg: '#D1FAE5' },
  Rejected:  { label: '❌ Ditolak',             color: '#991B1B', bg: '#FEE2E2' },
  Completed: { label: '🏆 Lunas',               color: '#1E40AF', bg: '#DBEAFE' },
}

export default function LoanDetailScreen({ route, navigation }: Props) {
  const { auth } = useAuth()
  const { loanId } = route.params
  const [loan,    setLoan]    = useState<LoanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<LoanDetail>(`/loans/${loanId}`)
      setLoan(data)
    } catch {
      Alert.alert('Error', 'Gagal memuat data pinjaman.')
      navigation.goBack()
    } finally {
      setLoading(false); setRefresh(false)
    }
  }, [loanId])

  useEffect(() => { load() }, [load])
  const onRefresh = () => { setRefresh(true); load() }

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  )

  if (!loan) return null

  const status  = STATUS_MAP[loan.status] ?? STATUS_MAP['Pending']
  const paid    = loan.installments.filter(i => i.isPaid).length
  const total   = loan.installments.length
  const progPct = total > 0 ? paid / total : 0

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        {loan.rejectionReason && (
          <Text style={styles.rejectionReason}>📝 {loan.rejectionReason}</Text>
        )}
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryAmount}>{fmtCurrency(loan.amount)}</Text>
        <Text style={styles.summarySub}>{loan.tenorMonths} bulan · {loan.interestRatePerMonth}%/bln flat</Text>

        <View style={styles.summaryGrid}>
          {[
            ['Cicilan/Bln',   fmtCurrency(loan.monthlyInstallment)],
            ['Total Bunga',   fmtCurrency(loan.totalInterest)],
            ['Total Bayar',   fmtCurrency(loan.totalAmountDue)],
            ['Tgl Pengajuan', fmtDate(loan.appliedAt)],
            ['Tgl Cair',      fmtDate(loan.disbursementDate)],
            ['Tujuan',        loan.purpose ?? '-'],
          ].map(([k, v]) => (
            <View key={k} style={styles.summaryItem}>
              <Text style={styles.summaryKey}>{k}</Text>
              <Text style={styles.summaryVal}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progress Cicilan */}
      {loan.status === 'Active' && loan.installments.length > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progres Cicilan</Text>
            <Text style={styles.progressCount}>{paid}/{total} terbayar</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progPct * 100}%` as `${number}%` }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(progPct * 100)}%</Text>
        </View>
      )}

      {/* Tabel Cicilan */}
      {loan.installments.length > 0 && (
        <View style={styles.installmentsCard}>
          <Text style={styles.instTitle}>Jadwal Cicilan</Text>
          {loan.installments.map(inst => (
            <View key={inst.id}
              style={[styles.instRow, inst.isPaid && styles.instRowPaid, inst.isOverdue && styles.instRowOverdue]}>
              <View style={styles.instLeft}>
                <Text style={styles.instNum}>#{inst.installmentNumber}</Text>
                <Text style={styles.instDate}>{fmtDate(inst.dueDate)}</Text>
              </View>
              <View style={styles.instRight}>
                <Text style={styles.instAmount}>{fmtCurrency(inst.amountToPay)}</Text>
                <View style={[styles.instBadge,
                  inst.isPaid ? styles.instBadgePaid
                  : inst.isOverdue ? styles.instBadgeOverdue
                  : styles.instBadgePending]}>
                  <Text style={[styles.instBadgeText,
                    inst.isPaid ? styles.instBadgeTextPaid
                    : inst.isOverdue ? styles.instBadgeTextOverdue
                    : styles.instBadgeTextPending]}>
                    {inst.isPaid ? '✓ Lunas' : inst.isOverdue ? '! Jatuh Tempo' : 'Belum'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:                { flex: 1, backgroundColor: COLORS.gray50 },
  scroll:              { padding: 16, paddingBottom: 40 },
  loading:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBanner:        { borderRadius: 14, padding: 14, marginBottom: 16, alignItems: 'center' },
  statusText:          { fontSize: 15, fontWeight: '700' },
  rejectionReason:     { fontSize: 12, marginTop: 6, textAlign: 'center', opacity: 0.8 },
  summaryCard:         {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  summaryAmount:       { fontSize: 30, fontWeight: '900', color: COLORS.gray900, letterSpacing: -1, textAlign: 'center' },
  summarySub:          { fontSize: 12, color: COLORS.gray400, textAlign: 'center', marginBottom: 16 },
  summaryGrid:         { gap: 8 },
  summaryItem:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  summaryKey:          { fontSize: 12, color: COLORS.gray500 },
  summaryVal:          { fontSize: 12, fontWeight: '600', color: COLORS.gray900 },
  progressCard:        {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  progressHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle:       { fontSize: 13, fontWeight: '700', color: COLORS.gray700 },
  progressCount:       { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  progressBg:          { height: 10, backgroundColor: COLORS.gray100, borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  progressFill:        { height: '100%', backgroundColor: COLORS.success, borderRadius: 99 },
  progressPct:         { fontSize: 10, color: COLORS.gray400, textAlign: 'right' },
  installmentsCard:    {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  instTitle:           { fontSize: 13, fontWeight: '700', color: COLORS.gray700, marginBottom: 12 },
  instRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  instRowPaid:         { opacity: 0.6 },
  instRowOverdue:      { backgroundColor: '#FFF5F5', marginHorizontal: -16, paddingHorizontal: 16 },
  instLeft:            {},
  instNum:             { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  instDate:            { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  instRight:           { alignItems: 'flex-end' },
  instAmount:          { fontSize: 13, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  instBadge:           { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  instBadgePaid:       { backgroundColor: COLORS.successLight },
  instBadgeOverdue:    { backgroundColor: COLORS.dangerLight },
  instBadgePending:    { backgroundColor: COLORS.gray100 },
  instBadgeText:       { fontSize: 10, fontWeight: '600' },
  instBadgeTextPaid:   { color: '#065F46' },
  instBadgeTextOverdue:{ color: COLORS.danger },
  instBadgeTextPending:{ color: COLORS.gray500 },
})
