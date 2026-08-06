import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  const cardRef = useRef(null)

  // State for mouse parallax perspective
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  // State for interactive ripples
  const [ripples, setRipples] = useState([])
  // State for search query & route suggestions
  const [searchQuery, setSearchQuery] = useState('')
  // Sound state (synthesized using Web Audio API)
  const [soundEnabled, setSoundEnabled] = useState(true)
  // Radar ping count
  const [pingCount, setPingCount] = useState(404)

  // Available routes for quick search
  const availableRoutes = [
    { title: 'Dashboard Utama', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { title: 'Dashboard Admin Tukang', path: '/dashboard-tukang', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { title: 'Super Admin Portal', path: '/admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { title: 'Kelola Master Data', path: '/admin/master', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { title: 'Halaman Login', path: '/', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' },
  ]

  const filteredRoutes = searchQuery.trim() === '' 
    ? [] 
    : availableRoutes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Mouse Parallax movement handler
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    setMousePos({ x, y })
  }

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 })
  }

  // Play subtle UI chime using Web Audio API
  const playSoundEffect = (freq = 520, type = 'sine') => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15)

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } catch (err) {
      // Audio context policy fallback
    }
  }

  // Radar Orb Click Trigger
  const triggerRadarPulse = (e) => {
    playSoundEffect(640, 'triangle')
    setPingCount(prev => prev + 1)
    
    // Add ripple
    const rect = e.currentTarget.getBoundingClientRect()
    const newRipple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    setRipples(prev => [...prev.slice(-4), newRipple])
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center font-sans p-4 sm:p-6 bg-slate-950 text-slate-100 relative overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Animated Ambient Background Mesh & Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-700 ease-out"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
          backgroundSize: '36px 36px',
          transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0)`
        }}
      />

      {/* 2. Floating Ambient Glow Orbs */}
      <div 
        className="absolute -top-40 -left-40 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-[#CE2328]/25 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"
        style={{ transform: `translate3d(${mousePos.x * 25}px, ${mousePos.y * 25}px, 0)` }}
      />
      <div 
        className="absolute -bottom-40 -right-40 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-[#82C341]/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"
        style={{ animationDelay: '2s', transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 0)` }}
      />

      {/* 3. Floating Ambient Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/30 animate-particle"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              left: `${(i * 8.3) + 4}%`,
              bottom: `${(i * 7) % 30}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${4 + (i % 4)}s`
            }}
          />
        ))}
      </div>

      {/* 4. Floating Decorative Tech Badges */}
      <div 
        className="hidden md:flex absolute top-10 left-12 items-center gap-2.5 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-800 text-xs font-mono text-slate-400 shadow-xl animate-float-slow"
        style={{ transform: `translate3d(${mousePos.x * 12}px, ${mousePos.y * 12}px, 0)` }}
      >
        <span className="w-2 h-2 rounded-full bg-[#CE2328] animate-ping" />
        <span>SIGNAL_STATUS: 404_NOT_FOUND</span>
      </div>

      <div 
        className="hidden md:flex absolute bottom-12 left-12 items-center gap-2.5 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-800 text-xs font-mono text-slate-400 shadow-xl animate-float-reverse"
        style={{ transform: `translate3d(${mousePos.x * -10}px, ${mousePos.y * 10}px, 0)` }}
      >
        <svg className="w-3.5 h-3.5 text-[#82C341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>TATA_NAVIGATOR_v2.0</span>
      </div>

      <div 
        className="hidden md:flex absolute top-12 right-12 items-center gap-2.5 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-800 text-xs font-mono text-slate-400 shadow-xl animate-float-reverse"
        style={{ transform: `translate3d(${mousePos.x * 15}px, ${mousePos.y * -15}px, 0)` }}
      >
        <span>PING_COUNT: {pingCount}</span>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="ml-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={soundEnabled ? 'Matikan Suara FX' : 'Aktifkan Suara FX'}
        >
          {soundEnabled ? (
            <svg className="w-3.5 h-3.5 text-[#82C341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      </div>

      {/* 5. Main Card Container with Interactive 3D Perspective */}
      <div 
        ref={cardRef}
        className="w-full max-w-xl bg-slate-900/70 backdrop-blur-2xl p-8 sm:p-12 rounded-3xl border border-slate-800/90 shadow-[0_30px_80px_rgba(0,0,0,0.6)] text-center animate-fade-in relative z-10 transition-transform duration-200 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${mousePos.y * -6}deg) rotateY(${mousePos.x * 6}deg)`
        }}
      >
        {/* Decorative Top Accent Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#CE2328] to-transparent shadow-[0_0_15px_#CE2328]" />

        {/* Brand Logo Header */}
        <div className="flex justify-center mb-6">
          <div className="relative group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="absolute -inset-2 bg-gradient-to-r from-[#CE2328] to-[#82C341] rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse-glow" />
            <img 
              src="/logo-tata.png" 
              alt="Logo TATA" 
              className="h-14 sm:h-16 w-auto object-contain relative z-10 drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-105" 
            />
          </div>
        </div>

        {/* 6. Interactive 404 Hero Section with Central Radar Orb */}
        <div className="relative flex items-center justify-center my-6 py-2 select-none">
          
          {/* Digit 4 (Left) */}
          <span className="text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-float-slow">
            4
          </span>

          {/* Center Digit 0 -> Interactive Radar Portal */}
          <div 
            onClick={triggerRadarPulse}
            className="relative w-24 h-24 sm:w-32 sm:h-32 mx-1 sm:mx-3 flex items-center justify-center cursor-pointer group"
            title="Klik untuk memicu Radar Pulse!"
          >
            {/* Outer Orbiting Satellite Ring 1 */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-700/80 animate-orbit" />
            
            {/* Outer Satellite Dot 1 */}
            <div className="absolute inset-0 animate-orbit">
              <div className="w-3 h-3 rounded-full bg-[#CE2328] shadow-[0_0_10px_#CE2328] absolute -top-1.5 left-1/2 -translate-x-1/2" />
            </div>

            {/* Orbiting Satellite Ring 2 (Reverse) */}
            <div className="absolute inset-2 rounded-full border border-slate-800 animate-orbit-reverse" />
            <div className="absolute inset-2 animate-orbit-reverse">
              <div className="w-2.5 h-2.5 rounded-full bg-[#82C341] shadow-[0_0_10px_#82C341] absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
            </div>

            {/* Radar Scan Beam Layer */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700/60 shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(206,35,40,0.4)_360deg)] animate-radar-sweep opacity-70" />
            </div>

            {/* Glowing Core Orb */}
            <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#CE2328] to-[#82C341] p-[2px] shadow-[0_0_25px_rgba(206,35,40,0.6)] group-hover:scale-110 transition-transform duration-300">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>

            {/* Click Shockwave Ripples */}
            {ripples.map(r => (
              <div 
                key={r.id}
                className="absolute w-20 h-20 rounded-full border-2 border-[#82C341] pointer-events-none animate-ripple"
                style={{ top: r.y - 40, left: r.x - 40 }}
              />
            ))}
          </div>

          {/* Digit 4 (Right) */}
          <span className="text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-float-reverse">
            4
          </span>
        </div>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold tracking-widest uppercase rounded-full mb-3 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#CE2328] animate-ping" />
          Halaman Tidak Ditemukan
        </div>

        {/* Dynamic Heading with Animated Gradient Stream */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-2 tracking-tight">
          Oops! Alamat URL Tidak Tersedia
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed max-w-md mx-auto font-normal">
          Halaman yang Anda tuju telah dipindahkan, dihapus, atau mungkin salah ketik. Gunakan pencarian cepat atau opsi navigasi di bawah.
        </p>

        {/* 7. Quick Interactive Route Search Bar */}
        <div className="mb-6 relative max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rute halaman (cth: Dashboard, Login...)"
              className="w-full px-4 py-3 pl-10 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#CE2328] focus:ring-2 focus:ring-[#CE2328]/30 transition-all shadow-inner"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtered Suggestions Dropdown */}
          {filteredRoutes.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-30 divide-y divide-slate-800 animate-fade-in">
              {filteredRoutes.map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playSoundEffect(580, 'sine')
                    navigate(route.path)
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-slate-200 hover:bg-[#CE2328]/20 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#82C341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={route.icon} />
                    </svg>
                    <span className="font-semibold">{route.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-300">{route.path}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 8. Modern Sleek Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          {/* Main Dashboard Button */}
          <button
            onClick={() => {
              playSoundEffect(520, 'sine')
              navigate('/dashboard')
            }}
            className="w-full sm:w-auto flex-1 px-6 py-3.5 bg-gradient-to-r from-[#CE2328] via-[#e22b31] to-[#b41c21] hover:from-[#b41c21] hover:to-[#911418] text-white font-extrabold text-xs rounded-xl shadow-[0_10px_25px_rgba(206,35,40,0.4)] hover:shadow-[0_15px_30px_rgba(206,35,40,0.6)] transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden active:scale-95 cursor-pointer"
          >
            {/* Hover Shimmer Effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 animate-shimmer pointer-events-none" />

            <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Ke Dashboard</span>
          </button>

          {/* Login Button */}
          <button
            onClick={() => {
              playSoundEffect(480, 'sine')
              navigate('/')
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Halaman Login</span>
          </button>

          {/* Back Previous Page Button */}
          <button
            onClick={() => {
              playSoundEffect(440, 'sine')
              navigate(-1)
            }}
            className="w-full sm:w-auto px-4 py-3.5 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl border border-slate-800/80 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            title="Kembali ke halaman sebelumnya"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali</span>
          </button>
        </div>

      </div>

    </div>
  )
}
