import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function EditProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [namaLengkap, setNamaLengkap] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!isOpen) return

    const loadUserData = async () => {
      setMsg({ type: '', text: '' })
      setNewPassword('')
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        setUser(currentUser)
        setEmail(currentUser.email || '')
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, nama_lengkap')
          .eq('id', currentUser.id)
          .single()
        
        if (profile) {
          setUsername(profile.username || '')
          setNamaLengkap(profile.nama_lengkap || '')
        }
      }
    }

    loadUserData()
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg({ type: '', text: '' })

    try {
      if (!user) throw new Error("Sesi pengguna tidak ditemukan. Silakan login kembali.")

      const cleanUsername = username.trim().toLowerCase()
      const cleanNamaLengkap = namaLengkap.trim()

      if (!cleanUsername) throw new Error("Username tidak boleh kosong.")
      if (!cleanNamaLengkap) throw new Error("Nama lengkap tidak boleh kosong.")

      // 1. Cek apakah username sudah dipakai oleh user lain
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', user.id)
        .maybeSingle()

      if (checkError) throw checkError
      if (existingUser) {
        throw new Error(`Username '${cleanUsername}' sudah digunakan oleh pengguna lain. Silakan pilih username lain.`)
      }

      // 2. Update data di tabel profiles (username & nama_lengkap)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          nama_lengkap: cleanNamaLengkap
        })
        .eq('id', user.id)

      if (profileError) {
        if (profileError.code === '42501') {
          throw new Error("Izin update ditolak (RLS Policy). Pastikan RLS di Supabase mengizinkan pengguna mengubah profilnya sendiri.")
        }
        throw profileError
      }

      // 3. Sync Auth Email & Password
      // Jika email tidak diisi manual atau formatnya menggunakan domain internal (@tata.com / @app.local),
      // kita otomatis sinkronkan Auth Email agar cocok dengan username baru saat login.
      const authUpdates = {}
      let targetEmail = email.trim().toLowerCase()

      if (!targetEmail || targetEmail.endsWith('@tata.com') || targetEmail.endsWith('@app.local')) {
        targetEmail = `${cleanUsername}@tata.com`
      }

      if (targetEmail && targetEmail !== user.email?.toLowerCase()) {
        authUpdates.email = targetEmail
      }

      if (newPassword.trim()) {
        authUpdates.password = newPassword.trim()
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates)
        if (authError) {
          console.warn("Gagal update Supabase Auth User (mungkin verifikasi email aktif atau email sudah dipakai):", authError.message)
          // Jika update profile sukses tapi auth email gagal, beri info tambahan
          setMsg({ 
            type: 'success', 
            text: `Profil berhasil diperbarui. Catatan: Email auth belum berubah (${authError.message})` 
          })
          if (onProfileUpdated) onProfileUpdated()
          setTimeout(() => { onClose() }, 2000)
          return
        }
      }

      setMsg({ type: 'success', text: 'Profil & Pengaturan Akun berhasil diperbarui!' })
      if (onProfileUpdated) onProfileUpdated()
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err) {
      console.error("Error edit profile:", err)
      setMsg({ type: 'error', text: err.message || 'Gagal mengedit profil.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 sm:p-8 shadow-2xl text-slate-900 relative max-h-[90vh] overflow-y-auto">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#CE2328]"></div>

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Edit Profil Saya</h3>
            <p className="text-xs text-slate-500 mt-0.5">Perbarui nama, username, atau kata sandi akun</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {msg.text && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold border ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-[#CE2328] border-red-200'
          }`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Username</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
              placeholder="Username login Anda"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nama Lengkap</label>
            <input 
              type="text"
              required
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
              placeholder="Nama Lengkap Anda"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Akun</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
              placeholder="contoh: user@tata.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password Baru (opsional)</label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
              placeholder="Kosongkan jika tidak ingin mengubah password"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white transition-all ${
                loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#CE2328] hover:bg-[#b41c21] shadow-lg shadow-[#CE2328]/25 active:scale-95'
              }`}
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
