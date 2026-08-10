import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [usernameInput, setUsernameInput] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false
    const checkActiveSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !ignore) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (ignore) return
        const role = profile?.role
        if (role === 'super_admin') {
          navigate('/admin', { replace: true })
        } else if (role === 'admin_tukang') {
          navigate('/dashboard-tukang', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    }
    checkActiveSession()
    return () => { ignore = true }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const input = usernameInput.trim()
      if (!input) throw new Error("Silakan masukkan username!")

      let emailToLogin = input

      // Jika input tidak mengandung '@', proses sebagai username
      if (!input.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, username')
          .ilike('username', input)
          .maybeSingle()

        if (profile && profile.username) {
          emailToLogin = `${profile.username.toLowerCase()}@tata.com`
        } else {
          emailToLogin = `${input.toLowerCase()}@tata.com`
        }
      }

      // 1. Fungsi bawaan Supabase untuk Login
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password: password,
      })

      // Jika gagal dan input berupa username polos, coba variasi domain fallback (@kontraktor.com, @app.local, @tata.com)
      if (authError && !input.includes('@')) {
        const cleanInput = input.toLowerCase()
        const candidateEmails = [
          `${cleanInput}@kontraktor.com`,
          `${cleanInput}@app.local`,
          `${cleanInput}@tata.com`,
        ]
        
        for (const fallbackEmail of candidateEmails) {
          if (fallbackEmail === emailToLogin) continue
          const fallbackRes = await supabase.auth.signInWithPassword({
            email: fallbackEmail,
            password: password,
          })
          if (!fallbackRes.error) {
            authData = fallbackRes.data
            authError = null
            break
          }
        }
      }

      if (authError) {
        throw new Error("Gagal Login: Pastikan Username dan Password Anda benar!")
      }

      // 2. Kalau login berhasil, ambil data 'role' dari tabel 'profiles'
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (profileError) throw profileError

        // 3. Arahkan rute sesuai role
        if (profileData.role === 'super_admin') {
          navigate('/admin')
        } else if (profileData.role === 'admin_tukang') {
          navigate('/dashboard-tukang')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      console.error("Gagal login:", error.message)
      setErrorMsg(error.message || "Gagal Login!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#CE2328]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#82C341]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/90 animate-fade-in relative z-10">
        
        {/* Logo Only */}
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src="/logo-tata.png" 
            alt="Logo" 
            className="h-20 w-auto object-contain mb-4"
          />
          <h1 className="text-xl font-bold text-slate-800">
            Sistem Absensi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Masuk dengan Username resmi
          </p>
        </div>

        {/* Error notification alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#CE2328] text-[#CE2328] rounded-xl text-xs font-semibold flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:border-[#CE2328] focus:bg-white transition-all font-medium placeholder-slate-400"
                placeholder="contoh: iman atau admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:border-[#CE2328] focus:bg-white transition-all font-medium placeholder-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.022 10.022 0 013.682-.663c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.092-4.092a3 3 0 11-4.243-4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-[#CE2328] hover:bg-[#b41c21] shadow-lg shadow-[#CE2328]/30 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span>Memproses Login...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}