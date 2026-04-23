import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Animated, Easing
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList, LoanSummary } from '../types'
import { COLORS } from '../constants'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { fmtCurrency, fmtDate } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'MyLoans'>

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Pending:   { label: '⏳ Menunggu Review', color: '#92400E', bg: '#FEF9C3', border: '#FDE047' },
  Active:    { label: '✅ Aktif',           color: '#065F46', bg: '#D1FAE5', border: '#34D399' },
  Rejected:  { label: '❌ Ditolak',        color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
  Completed: { label: '🏆 Lunas',          color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyActive({ onApply }: { onApply: () => void }) {
  const float = new Animated.Value(0)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -10, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0,   duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={styles.emptyWrap}>
      <Animated.Text style={[styles.emptyIllustration, { transform: [{ translateY: float }] }]}>
        🏦
      </Animated.Text>
      <Text style={styles.emptyTitle}>Belum Ada Pinjaman Aktif</Text>
      <Text style={styles.emptySub}>
        Kamu tidak memiliki pinjaman aktif saat ini.{'\n'}
        Ajukan pinjaman pertamamu dan dapatkan dana dalam 1x24 jam!
      </Text>

      {/* Feature bullets */}
      <View style={styles.featureList}>
        {[
          ['💰', 'Limit hingga Rp 10.000.000'],
          ['⚡', 'Proses cepat & transparan'],
          ['📱', 'Pantau cicilan dari aplikasi'],
        ].map(([icon, text]) => (
          <View key={text} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.85}>
        <Text style={styles.applyBtnText}>💰 Ajukan Pinjaman Sekarang</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyLoansScreen({ navigation }: Props) {
  const { auth }  = useAuth()
  const [loans,   setLoans]   = useState<LoanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)

  const load = useCallback(async () => {
    if (!auth?.memberId) return
    try {
      const { data } = await api.get<LoanSummary[]>(`/loans/member/${auth.memberId}`)
      setLoans(data)
    } finally {
      setLoading(false)
      setRefresh(false)
    }
  }, [auth?.memberId])

  useEffect(() => { load() }, [load])
  const onRefresh = () => { setRefresh(true); load() }

  const activeLoan    = loans.find(l => l.status === 'Active')
  const pendingLoan   = loans.find(l => l.status === 'Pending')
  const historyLoans  = loans.filter(l => l.status === 'Completed' || l.status === 'Rejected')

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  )

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}>

      {/* ── HEADER ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Pinjaman Saya</Text>
        <Text style={styles.pageSub}>{loans.length} total pinjaman tercatat</Text>
      </View>

      {/* ══════════════════════════════════════
          EMPTY STATE — tidak ada pinjaman sama sekali
      ══════════════════════════════════════ */}
      {loans.length === 0 && (
        <EmptyActive onApply={() => navigation.navigate('ApplyLoan')} />
      )}

      {/* ══════════════════════════════════════
          ACTIVE LOAN — banner + tombol tracking
      ══════════════════════════════════════ */}
      {activeLoan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pinjaman Aktif</Text>
          <View style={styles.activeCard}>
            {/* Top */}
            <View style={styles.activeTop}>
              <View>
                <Text style={styles.activeLabel}>Total Pinjaman</Text>
                <Text style={styles.activeAmount}>{fmtCurrency(activeLoan.amount)}</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✅ Aktif</Text>
              </View>
            </View>

            {/* Info grid */}
            <View style={styles.activeGrid}>
              {[
                ['Cicilan/Bln',   fmtCurrency(activeLoan.monthlyInstallment)],
                ['Tenor',         `${activeLoan.tenorMonths} bulan`],
                ['Total Bayar',   fmtCurrency(activeLoan.totalAmountDue)],
                ['Tgl Cair',      fmtDate(activeLoan.disbursementDate)],
              ].map(([k, v]) => (
                <View key={k} style={styles.activeGridItem}>
                  <Text style={styles.activeGridLabel}>{k}</Text>
                  <Text style={styles.activeGridValue}>{v}</Text>
                </View>
              ))}
            </View>

            {/* CTA Tracking */}
            <TouchableOpacity
              style={styles.trackingBtn}
              onPress={() => navigation.navigate('Tracking', { loanId: activeLoan.id })}
              activeOpacity={0.85}>
              <Text style={styles.trackingBtnText}>📊 Lihat & Bayar Cicilan →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════
          PENDING LOAN
      ══════════════════════════════════════ */}
      {pendingLoan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menunggu Persetujuan</Text>
          <TouchableOpacity
            style={styles.pendingCard}
            onPress={() => navigation.navigate('LoanDetail', { loanId: pendingLoan.id })}
            activeOpacity={0.85}>
            <View style={styles.pendingLeft}>
              <Text style={styles.pendingAmount}>{fmtCurrency(pendingLoan.amount)}</Text>
              <Text style={styles.pendingInfo}>
                {pendingLoan.tenorMonths} bln · {fmtCurrency(pendingLoan.monthlyInstallment)}/bln
              </Text>
              <Text style={styles.pendingDate}>Diajukan {fmtDate(pendingLoan.appliedAt)}</Text>
            </View>
            <View style={styles.pendingRight}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>⏳</Text>
              </View>
              <Text style={styles.pendingStatus}>Pending</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════
          EMPTY ACTIVE — ada history tapi tidak ada aktif
      ══════════════════════════════════════ */}
      {!activeLoan && !pendingLoan && loans.length > 0 && (
        <View style={styles.noActiveWrap}>
          <Text style={styles.noActiveIcon}>🎉</Text>
          <Text style={styles.noActiveTitle}>Tidak Ada Pinjaman Aktif</Text>
          <Text style={styles.noActiveSub}>Semua pinjaman sebelumnya telah lunas!</Text>
          <TouchableOpacity
            style={styles.reapplyBtn}
            onPress={() => navigation.navigate('ApplyLoan')}
            activeOpacity={0.85}>
            <Text style={styles.reapplyBtnText}>Ajukan Pinjaman Baru</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════
          RIWAYAT (Lunas / Ditolak)
      ══════════════════════════════════════ */}
      {historyLoans.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riwayat Pinjaman</Text>
          {historyLoans.map(loan => {
            const cfg = STATUS_CONFIG[loan.status]
            return (
              <TouchableOpacity
                key={loan.id}
                style={[styles.historyCard, { borderColor: cfg.border }]}
                onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
                activeOpacity={0.8}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyAmount}>{fmtCurrency(loan.amount)}</Text>
                  <View style={[styles.historyBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.historyBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyMetaText}>📅 {fmtDate(loan.appliedAt)}</Text>
                  <Text style={styles.historyMetaText}>⏱ {loan.tenorMonths} bln</Text>
                  <Text style={styles.historyMetaText}>💳 {fmtCurrency(loan.monthlyInstallment)}/bln</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.gray50 },
  scroll:             { paddingBottom: 40 },
  loading:            { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  pageHeader:         { padding: 20, paddingBottom: 8 },
  pageTitle:          { fontSize: 24, fontWeight: '800', color: COLORS.gray900, letterSpacing: -0.5 },
  pageSub:            { fontSize: 13, color: COLORS.gray400, marginTop: 3 },

  // Section
  section:            { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle:       { fontSize: 14, fontWeight: '700', color: COLORS.gray700, marginBottom: 10 },

  // Active Card
  activeCard:         {
    backgroundColor: COLORS.primary, borderRadius: 20, padding: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  activeTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  activeLabel:        { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  activeAmount:       { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  activeBadge:        { backgroundColor: COLORS.successLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText:    { fontSize: 11, fontWeight: '700', color: '#065F46' },
  activeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  activeGridItem:     { width: '47%', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 10 },
  activeGridLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 3 },
  activeGridValue:    { fontSize: 13, fontWeight: '700', color: COLORS.white },
  trackingBtn:        {
    backgroundColor: COLORS.white, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  trackingBtnText:    { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  // Pending Card
  pendingCard:        {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 2, borderColor: '#FDE047',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  pendingLeft:        { flex: 1 },
  pendingAmount:      { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
  pendingInfo:        { fontSize: 12, color: COLORS.gray500, marginBottom: 2 },
  pendingDate:        { fontSize: 11, color: COLORS.gray400 },
  pendingRight:       { alignItems: 'center', marginLeft: 12 },
  pendingBadge:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pendingBadgeText:   { fontSize: 20 },
  pendingStatus:      { fontSize: 10, fontWeight: '600', color: '#92400E' },

  // No Active (history but no current loan)
  noActiveWrap:       { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  noActiveIcon:       { fontSize: 48, marginBottom: 10 },
  noActiveTitle:      { fontSize: 17, fontWeight: '700', color: COLORS.gray900, marginBottom: 6 },
  noActiveSub:        { fontSize: 13, color: COLORS.gray400, textAlign: 'center', marginBottom: 20 },
  reapplyBtn:         {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  reapplyBtnText:     { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Empty (no loans at all)
  emptyWrap:          { paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' },
  emptyIllustration:  { fontSize: 80, marginBottom: 20 },
  emptyTitle:         { fontSize: 20, fontWeight: '800', color: COLORS.gray900, textAlign: 'center', marginBottom: 10 },
  emptySub:           { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  featureList:        { width: '100%', marginBottom: 28, gap: 10 },
  featureItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 10, padding: 12 },
  featureIcon:        { fontSize: 20 },
  featureText:        { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  applyBtn:           {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 32,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  applyBtnText:       { fontSize: 15, fontWeight: '800', color: COLORS.white },

  // History
  historyCard:        {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1.5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  historyHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyAmount:      { fontSize: 18, fontWeight: '800', color: COLORS.gray900 },
  historyBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  historyBadgeText:   { fontSize: 11, fontWeight: '600' },
  historyMeta:        { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  historyMetaText:    { fontSize: 11, color: COLORS.gray500 },
})
