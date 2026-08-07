import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ title, userRole, onEditProfile, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isCurrent = (path) => location.pathname === path
  const isSuperAdmin = userRole === 'super_admin'

  const handleLogoClick = () => {
    if (isSuperAdmin) {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 relative">
          
          {/* Left: Logo Only */}
          <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
            <img 
              src="/logo-tata.png" 
              alt="Logo" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105" 
            />
          </div>

          {/* Center: Title */}
          {title && (
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none max-w-[160px] xs:max-w-[200px] sm:max-w-xs md:max-w-none px-1">
              <h1 className="text-xs sm:text-base md:text-lg font-extrabold text-slate-800 tracking-tight truncate">
                {title}
              </h1>
            </div>
          )}

          {/* Right: Action Navigation Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Admin Panel Button for Super Admin when on another page */}
            {isSuperAdmin && !isCurrent('/admin') && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#CE2328] text-white hover:bg-[#b41c21] transition-all shadow-sm active:scale-95"
              >
                Admin Panel
              </button>
            )}

            {/* Non Super Admin buttons */}
            {!isSuperAdmin && userRole === 'admin_tukang' && !isCurrent('/dashboard-tukang') && (
              <button
                onClick={() => navigate('/dashboard-tukang')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-all active:scale-95"
              >
                Absen Tim
              </button>
            )}

            {!isSuperAdmin && !isCurrent('/dashboard') && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"
              >
                Absen Saya
              </button>
            )}

            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 transition-all active:scale-95"
              >
                Profil
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-[#CE2328] hover:bg-[#CE2328] hover:text-white border border-red-200 transition-all active:scale-95"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu with Smooth Slide Animation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2.5 animate-slide-down shadow-xl border-b rounded-b-2xl">
          {isSuperAdmin ? (
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
              className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                isCurrent('/admin') ? 'bg-[#CE2328] text-white shadow-md shadow-[#CE2328]/20' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              Admin Panel
            </button>
          ) : (
            <>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                  isCurrent('/dashboard') ? 'bg-[#CE2328] text-white shadow-md shadow-[#CE2328]/20' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                Absen Saya
              </button>

              {userRole === 'admin_tukang' && (
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/dashboard-tukang'); }}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                    isCurrent('/dashboard-tukang') ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  Absen Tim
                </button>
              )}
            </>
          )}

          {onEditProfile && (
            <button
              onClick={() => { setMobileMenuOpen(false); onEditProfile(); }}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 text-left transition-colors"
            >
              Edit Profil
            </button>
          )}

          {onLogout && (
            <button
              onClick={() => { setMobileMenuOpen(false); onLogout(); }}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#CE2328] hover:bg-[#b41c21] text-left shadow-md transition-all active:scale-[0.99]"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  )
}
