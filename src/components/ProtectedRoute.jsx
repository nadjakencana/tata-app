import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    let ignore = false

    const cekAkses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (ignore) return

        if (!user) {
          setHasAccess(false)
          setLoading(false)
          return
        }

        // Jika tidak ada pembatasan role khusus, pengguna yang telah login diizinkan masuk
        if (!allowedRoles || allowedRoles.length === 0) {
          setHasAccess(true)
          setLoading(false)
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (ignore) return
        if (error && error.code !== 'PGRST116') throw error

        const userRole = profile?.role || 'karyawan'

        if (allowedRoles.includes(userRole)) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
        }
      } catch (error) {
        if (!ignore) {
          console.error("Gagal cek akses:", error.message)
          setHasAccess(false)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    cekAkses()

    return () => {
      ignore = true
    }
  }, [allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#CE2328] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Memeriksa akses keamanan...</p>
        </div>
      </div>
    )
  }

  return hasAccess ? children : <Navigate to="/" replace />
}
