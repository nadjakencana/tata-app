import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import DashboardTukang from './pages/DashboardTukang' 
import ProtectedRoute from './components/ProtectedRoute' 
import MasterData from './pages/MasterData'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      {/* Rute publik */}
      <Route path="/" element={<Login />} />
      
      {/* Rute Dashboard Karyawan */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Rute KHUSUS Admin Tukang */}
      <Route 
        path="/dashboard-tukang" 
        element={
          <ProtectedRoute allowedRoles={['admin_tukang']}> 
            <DashboardTukang />
          </ProtectedRoute>
        } 
      />
      
      {/* Rute KHUSUS Super Admin */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}> 
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Rute KHUSUS Kelola Data Master (Super Admin) */}
      <Route 
        path="/admin/master" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}> 
            <MasterData />
          </ProtectedRoute>
        } 
      />

      {/* Rute 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App