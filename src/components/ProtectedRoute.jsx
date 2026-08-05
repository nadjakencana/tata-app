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

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (ignore) return
        if (error) throw error

        if (profile && allowedRoles.includes(profile.role)) {
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

  if (loading) return <p className="text-center mt-12 text-gray-300">Memeriksa akses keamanan...</p>

  return hasAccess ? children : <Navigate to="/" replace />
}
