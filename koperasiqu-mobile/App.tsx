import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider, useAuth } from './src/context/AuthContext'
import type { RootStackParamList } from './src/types'
import { COLORS } from './src/constants'

import LoginScreen      from './src/screens/LoginScreen'
import DashboardScreen  from './src/screens/DashboardScreen'
import ApplyLoanScreen  from './src/screens/ApplyLoanScreen'
import LoanDetailScreen from './src/screens/LoanDetailScreen'
import MyLoansScreen    from './src/screens/MyLoansScreen'
import TrackingScreen   from './src/screens/TrackingScreen'
import ChangePinScreen  from './src/screens/ChangePinScreen'

import { ActivityIndicator, View } from 'react-native'

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppNavigator() {
  const { auth, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:       { backgroundColor: COLORS.white },
        headerTintColor:   COLORS.primary,
        headerTitleStyle:  { fontWeight: '700', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle:      { backgroundColor: COLORS.gray50 },
      }}>
      {!auth ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ApplyLoan"
            component={ApplyLoanScreen}
            options={{
              title: 'Ajukan Pinjaman',
              headerBackTitle: 'Kembali',
            }}
          />
          <Stack.Screen
            name="MyLoans"
            component={MyLoansScreen}
            options={{ title: 'Pinjaman Saya', headerBackTitle: 'Kembali' }}
          />
          <Stack.Screen
            name="Tracking"
            component={TrackingScreen}
            options={{
              title: 'Tracking Cicilan',
              headerBackTitle: 'Kembali',
              headerStyle:       { backgroundColor: COLORS.primary },
              headerTintColor:   COLORS.white,
              headerTitleStyle:  { fontWeight: '700', color: COLORS.white },
            }}
          />
          <Stack.Screen
            name="LoanDetail"
            component={LoanDetailScreen}
            options={{ title: 'Detail Pinjaman', headerBackTitle: 'Kembali' }}
          />
          <Stack.Screen
            name="ChangePin"
            component={ChangePinScreen}
            options={{ title: 'Ubah PIN', headerBackTitle: 'Kembali' }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
