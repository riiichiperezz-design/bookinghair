import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Login } from './pages/Login'
import { Agenda } from './pages/Agenda'
import { Servicios } from './pages/Servicios'
import { Ajustes } from './pages/Ajustes'
import { Recordatorios } from './pages/Recordatorios'
import { Demo } from './pages/Demo'
import { ReservaPublica } from './pages/ReservaPublica'
import { PrivateRoute } from './components/PrivateRoute'
import { Layout } from './components/Layout'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reservar/:slug" element={<ReservaPublica />} />
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="/recordatorios" element={<Recordatorios />} />
            <Route path="/demo" element={<Demo />} />
          </Route>
          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
