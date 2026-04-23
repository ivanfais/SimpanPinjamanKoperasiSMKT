import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList, Member, LoanSummary } from '../types'
import { COLORS } from '../constants'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { fmtCurrency, fmtDate } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Pending:   { color: '#92400E', bg: COLORS.warningLight, label: '⏳ Menunggu Staf' },
  PendingManager: { color: '#6B21A8', bg: '#F3E8FF', label: '👑 Menunggu Manager' },
  Active:    { color: '#065F46', bg: COLORS.successLight,  label: '✅ Aktif'    },
  Rejected:  { color: '#991B1B', bg: COLORS.dangerLight,  label: '❌ Ditolak'  },
  Completed: { color: '#1E40AF', bg: '#DBEAFE',           label: '🏆 Lunas'    },
}

export default function DashboardScreen({ navigation }: Props) {
  const { auth, logout } = useAuth()
  const [member,  setMember]  = useState<Member | null>(null)
  const [loans,   setLoans]   = useState<LoanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)

  const load = useCallback(async () => {
    if (!auth?.memberId) return
    try {
      const [{ data: m }, { data: l }] = await Promise.all([
        api.get<Member>(`/members/${auth.memberId}`),
        api.get<LoanSummary[]>(`/loans/member/${auth.memberId}`),
      ])
      setMember(m)
      setLoans(l)
    } catch {/* silent */} finally {
      setLoading(false)
      setRefresh(false)
    }
  }, [auth?.memberId])

  useEffect(() => { load() }, [load])

  const onRefresh = () => { setRefresh(true); load() }

  const activeLoan  = loans.find(l => l.status === 'Active')
  const pendingLoan = loans.find(l => l.status === 'Pending')

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

      {/* ── HEADER ── */}
      <View style={styles.headerGrad}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greet}>Selamat datang,</Text>
            <Text style={styles.name}>{member?.name ?? auth?.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => navigation.navigate('ChangePin')} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>⚙️ PIN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Keluar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Limit Summary */}
        <View style={styles.limitSummary}>
          <View style={styles.limitItem}>
            <Text style={styles.limitItemLabel}>Batas Kredit</Text>
            <Text style={styles.limitItemValue}>{fmtCurrency(member?.baseLimit ?? 0)}</Text>
          </View>
          <View style={styles.limitDivider} />
          <View style={styles.limitItem}>
            <Text style={styles.limitItemLabel}>Total Pinjaman</Text>
            <Text style={styles.limitItemValue}>{loans.length}</Text>
          </View>
          <View style={styles.limitDivider} />
          <View style={styles.limitItem}>
            <Text style={styles.limitItemLabel}>Status</Text>
            <Text style={[styles.limitItemValue, { color: member?.status === 'Active'
              ? COLORS.success : COLORS.danger }]}>
              {member?.status}
            </Text>
          </View>
        </View>

        {/* ── CREDIT SCORE BAR ── */}
        {member && (
          <View style={styles.scoreContainer}>
            <View style={styles.scoreHeader}>
              <Text style={styles.limitItemLabel}>Skor Kredit Anggota</Text>
              <Text style={[styles.scoreValue, { 
                color: (member.creditScore ?? 100) >= 80 ? COLORS.successLight : 
                       (member.creditScore ?? 100) >= 50 ? COLORS.warningLight : COLORS.dangerLight 
              }]}>
                {member.creditScore ?? 100} / 100
              </Text>
            </View>
            <View style={styles.scoreBarBg}>
              <View style={[styles.scoreBarFill, { 
                width: `${member.creditScore ?? 100}%`,
                backgroundColor: (member.creditScore ?? 100) >= 80 ? COLORS.success : 
                                 (member.creditScore ?? 100) >= 50 ? COLORS.warning : COLORS.danger 
              }]} />
            </View>
            {(member.creditScore ?? 100) < 50 ? (
              <Text style={styles.scoreWarningText}>⚠ Skor terlalu rendah. Pengajuan dinonaktifkan.</Text>
            ) : (member.creditScore ?? 100) < 80 ? (
              <Text style={[styles.scoreWarningText, { color: COLORS.warningLight }]}>⚠ Skor rawan. Pinjaman butuh persetujuan Manager.</Text>
            ) : null}
          </View>
        )}
      </View>

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary,
            (!!member?.hasActiveLoan || (member?.creditScore ?? 100) < 50) && styles.actionBtnDisabled]}
          onPress={() => navigation.navigate('ApplyLoan')}
          disabled={!!member?.hasActiveLoan || (member?.creditScore ?? 100) < 50}
          activeOpacity={0.85}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionLabel}>Ajukan Pinjaman</Text>
          {member?.hasActiveLoan ? (
            <Text style={styles.actionSub}>Ada pinjaman aktif</Text>
          ) : (member?.creditScore ?? 100) < 50 ? (
            <Text style={styles.actionSub}>Skor kredit ditolak</Text>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => navigation.navigate('MyLoans')}
          activeOpacity={0.85}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={[styles.actionLabel, { color: COLORS.primary }]}>Pinjaman Saya</Text>
          <Text style={styles.actionSub}>{loans.length} riwayat</Text>
        </TouchableOpacity>
      </View>

      {/* ── AKTIF / PENDING STATUS ── */}
      {(activeLoan || pendingLoan) && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status Terkini</Text>
          {[activeLoan, pendingLoan].filter(Boolean).map(loan => {
            const cfg = STATUS_CONFIG[loan!.status] ?? STATUS_CONFIG['Pending']
            return (
              <TouchableOpacity key={loan!.id}
                style={[styles.statusCard, { borderLeftColor: cfg.color }]}
                onPress={() => navigation.navigate('LoanDetail', { loanId: loan!.id })}
                activeOpacity={0.8}>
                <View style={styles.statusCardRow}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.statusAmount}>{fmtCurrency(loan!.amount)}</Text>
                </View>
                <Text style={styles.statusDetail}>
                  {loan!.tenorMonths} bulan · {fmtCurrency(loan!.monthlyInstallment)}/bln
                </Text>
                <Text style={styles.statusDate}>{fmtDate(loan!.appliedAt)}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* ── EMPTY ── */}
      {loans.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏦</Text>
          <Text style={styles.emptyTitle}>Belum Ada Pinjaman</Text>
          <Text style={styles.emptySub}>Ajukan pinjaman pertama kamu sekarang!</Text>
          <TouchableOpacity style={styles.emptyBtn}
            onPress={() => navigation.navigate('ApplyLoan')}>
            <Text style={styles.emptyBtnText}>Ajukan Sekarang</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.gray50 },
  scroll:             { paddingBottom: 40 },
  loading:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerGrad:         {
    backgroundColor: COLORS.primary, padding: 24, paddingTop: 56, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greet:              { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  name:               { fontSize: 20, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  logoutBtn:          { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  logoutText:         { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  limitSummary:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  limitItem:          { flex: 1, alignItems: 'center' },
  limitItemLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  limitItemValue:     { fontSize: 14, fontWeight: '700', color: COLORS.white },
  limitDivider:       { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  actions:            { flexDirection: 'row', gap: 12, padding: 20 },
  actionBtn:          {
    flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  actionBtnPrimary:   { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.3 },
  actionBtnSecondary: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.primaryLight },
  actionBtnDisabled:  { opacity: 0.5 },
  actionIcon:         { fontSize: 24 },
  actionLabel:        { fontSize: 13, fontWeight: '700', color: COLORS.white },
  actionSub:          { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  statusSection:      { paddingHorizontal: 20 },
  sectionTitle:       { fontSize: 14, fontWeight: '700', color: COLORS.gray700, marginBottom: 12 },
  statusCard:         {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 10,
    borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statusCardRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statusBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText:    { fontSize: 11, fontWeight: '600' },
  statusAmount:       { fontSize: 16, fontWeight: '800', color: COLORS.gray900 },
  statusDetail:       { fontSize: 12, color: COLORS.gray500 },
  statusDate:         { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  empty:              { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon:          { fontSize: 48, marginBottom: 12 },
  emptyTitle:         { fontSize: 17, fontWeight: '700', color: COLORS.gray700, marginBottom: 6 },
  emptySub:           { fontSize: 13, color: COLORS.gray400, textAlign: 'center', marginBottom: 20 },
  emptyBtn:           { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText:       { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  scoreContainer:     { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16 },
  scoreHeader:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  scoreValue:         { fontSize: 12, fontWeight: 'bold' },
  scoreBarBg:         { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill:       { height: '100%', borderRadius: 3 },
  scoreWarningText:   { fontSize: 10, color: COLORS.dangerLight, marginTop: 8, fontStyle: 'italic' },
})
