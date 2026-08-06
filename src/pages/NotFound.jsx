import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center font-sans p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#CE2328]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#82C341]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/90 text-center animate-fade-in relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo-tata.png" 
            alt="Logo" 
            className="h-16 w-auto object-contain" 
          />
        </div>

        {/* 404 Text */}
        <div className="relative mb-4">
          <h1 className="text-8xl sm:text-9xl font-black text-slate-200 tracking-widest select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-4 py-1.5 bg-[#CE2328] text-white font-extrabold text-xs uppercase tracking-widest rounded-full shadow-md">
              Halaman Tidak Ditemukan
            </span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Oops! Alamat URL Tidak Tersedia
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
          Halaman yang Anda cari tidak dapat ditemukan atau mungkin telah dipindahkan.
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#CE2328] hover:bg-[#b41c21] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#CE2328]/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Kembali ke Dashboard
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all"
          >
            Halaman Login
          </button>
        </div>

      </div>
    </div>
  )
}
