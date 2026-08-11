import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import EditProfileModal from '../components/EditProfileModal'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const [lokasi, setLokasi] = useState({ lat: null, lng: null })
  const [foto, setFoto] = useState(null)
  const [kameraAktif, setKameraAktif] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  const hentikanKamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
    setKameraAktif(false)
  }, [])

  const fetchUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, nama_lengkap, username')
        .eq('id', user.id)
        .single()
      if (profile) {
        setUserRole(profile.role)
        setUserData(profile)
      }
    }
  }, [])

  useEffect(() => {
    fetchUserData()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLokasi({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Gagal ambil GPS", err)
      )
    }

    const currentVideo = videoRef.current
    return () => {
      if (currentVideo && currentVideo.srcObject) {
        const tracks = currentVideo.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [fetchUserData])

  const handleLogout = async () => {
    hentikanKamera()
    await supabase.auth.signOut()
    navigate('/')
  }

  const mulaiKamera = async () => {
    setKameraAktif(true)
    setFoto(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      alert("Gagal mengakses kamera: " + err.message)
      setKameraAktif(false)
    }
  }

  const jepretFoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg')
    setFoto(dataUrl)
    hentikanKamera()
  }

  const kirimAbsen = async () => {
    if (!foto) return alert("Silakan ambil foto bukti terlebih dahulu!")
    if (!lokasi.lat || !lokasi.lng) return alert("Menunggu lokasi GPS... Pastikan izin lokasi aktif.")

    setLoadingSubmit(true)
    setErrorMsg('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesi login tidak ditemukan. Coba login ulang.")

      const resBlob = await fetch(foto)
      const blob = await resBlob.blob()
      const fileName = `karyawan_${user.id}_${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('foto_absen')
        .upload(fileName, blob, { contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('foto_absen')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('absen_karyawan')
        .insert([{
          user_id: user.id,
          waktu_absen: new Date().toISOString(),
          latitude: lokasi.lat,
          longitude: lokasi.lng,
          foto_url: publicUrlData.publicUrl
        }])

      if (dbError) throw dbError

      alert("Absen kehadiran Anda berhasil dicatat!")
      setFoto(null)

    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* Navbar with centered Absensi Karyawan title */}
      <Navbar 
        title="Absensi Karyawan" 
        userRole={userRole} 
        onEditProfile={() => setShowEditModal(true)} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        
        <div className="w-full bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_-15px_rgba(15,23,42,0.08)] border border-slate-200 animate-fade-in relative overflow-hidden">
          
          {/* Top Decorative Color Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#CE2328]"></div>

          {/* User Welcome Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#CE2328] border border-red-100 flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                {userData?.nama_lengkap?.charAt(0) || userData?.username?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                  {userData?.nama_lengkap || userData?.username || 'Karyawan'}
                </h2>
                <p className="text-xs text-slate-500">
                  {userRole === 'admin_tukang' ? 'Silakan absen diri Anda dulu di sini.' : 'Silakan jepret foto wajah dan verifikasi koordinat lokasi Anda.'}
                </p>
              </div>
            </div>

            {(userRole === 'admin_tukang' || userRole === 'super_admin') && (
              <button 
                onClick={() => { hentikanKamera(); navigate('/dashboard-tukang'); }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl transition-all text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Lanjut Absen Tim Tukang</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          {/* Alert Message */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#CE2328] text-[#CE2328] rounded-xl text-xs font-semibold flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* GPS Status Card */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${lokasi.lat ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Status Lokasi GPS</span>
              <span className={`text-xs font-extrabold truncate block ${lokasi.lat ? 'text-emerald-700' : 'text-amber-600 animate-pulse'}`}>
                {lokasi.lat ? `Koordinat Terkunci (${lokasi.lat.toFixed(5)}, ${lokasi.lng.toFixed(5)})` : 'Sedang mendeteksi sinyal GPS...'}
              </span>
            </div>
          </div>

          {/* Camera View & Capture Section */}
          <div className="flex flex-col items-center mb-8">
            {!kameraAktif && !foto && (
              <div className="w-full py-10 px-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 text-[#CE2328] border border-red-100 flex items-center justify-center mb-3 shadow-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Ambil Foto Absensi</h4>
                <p className="text-xs text-slate-500 mb-4 max-w-sm">
                  Pastikan wajah terlihat jelas.
                </p>
                <button 
                  onClick={mulaiKamera} 
                  className="bg-[#CE2328] hover:bg-[#b41c21] text-white px-6 py-3 rounded-xl font-extrabold text-xs shadow-lg shadow-[#CE2328]/25 transition-all flex items-center gap-2"
                >
                  Nyalakan Kamera
                </button>
              </div>
            )}

            <div className={`relative w-full max-w-md ${kameraAktif ? 'block' : 'hidden'}`}>
              <video ref={videoRef} autoPlay playsInline className="w-full max-w-full rounded-2xl border-4 border-[#CE2328] shadow-2xl overflow-hidden bg-slate-900 aspect-[4/3] object-cover" />
              <button 
                onClick={jepretFoto} 
                className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-[#CE2328] hover:bg-[#b41c21] text-white px-6 py-3 rounded-full font-extrabold text-sm shadow-2xl border-2 border-white transition-all flex items-center gap-2 active:scale-95"
              >
                Jepret Foto
              </button>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            {foto && (
              <div className="animate-fade-in w-full max-w-md flex flex-col items-center">
                <div className="relative w-full rounded-2xl border-4 border-[#82C341] shadow-xl overflow-hidden mb-4 bg-slate-900">
                  <img src={foto} alt="Preview Foto" className="w-full object-cover" />
                </div>
                <button 
                  onClick={mulaiKamera} 
                  className="text-xs bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-slate-700 font-bold border border-slate-200 transition-colors"
                >
                  Foto Ulang
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            onClick={kirimAbsen} 
            disabled={loadingSubmit || !foto || !lokasi.lat}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
              (loadingSubmit || !foto || !lokasi.lat) 
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed' 
                : 'bg-[#CE2328] hover:bg-[#b41c21] text-white shadow-xl shadow-[#CE2328]/30 active:scale-[0.98]'
            }`}
          >
            {loadingSubmit ? (
              <span>Mengirim Absensi...</span>
            ) : (
              <span>Kirim Kehadiran Saya</span>
            )}
          </button>

        </div>

      </main>

      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        onProfileUpdated={fetchUserData}
      />
    </div>
  )
}