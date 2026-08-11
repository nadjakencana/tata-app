import { useState, useEffect } from 'react';
import { supabase } from "../supabase";
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../components/EditProfileModal';
import Navbar from '../components/Navbar';

const DashboardTukang = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // State Absen Tim Pekerja
  const [proyekList, setProyekList] = useState([]);
  const [selectedProyek, setSelectedProyek] = useState('');
  const [tukangList, setTukangList] = useState([]);
  const [kehadiran, setKehadiran] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !ignore) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile && !ignore) setUserRole(profile.role);
      }
    };
    fetchRole();
    return () => { ignore = true; };
  }, []);

  // --- MENGAMBIL DAFTAR PROYEK SAAT LOAD ---
  useEffect(() => {
    let ignore = false;
    const fetchProyek = async () => {
      const { data, error } = await supabase.from('proyek').select('*').order('nama_proyek');
      if (!ignore && !error && data) setProyekList(data);
    };
    fetchProyek();
    return () => { ignore = true; };
  }, []);

  // --- MENGAMBIL DAFTAR TUKANG BERDASARKAN PROYEK ---
  useEffect(() => {
    if (!selectedProyek) return;
    
    let ignore = false;
    const fetchTukang = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tukang')
        .select('*')
        .eq('proyek_id', selectedProyek)
        .order('nama_tukang');
        
      if (!ignore) {
        if (!error && data) {
          setTukangList(data);
          const defaultKehadiran = {};
          data.forEach(t => defaultKehadiran[t.id] = 'Hadir');
          setKehadiran(defaultKehadiran);
        }
        setIsLoading(false);
      }
    };
    fetchTukang();
    return () => { ignore = true; };
  }, [selectedProyek]);

  const handleStatusChange = (tukangId, status) => {
    setKehadiran(prev => ({ ...prev, [tukangId]: status }));
  };

  const handleProyekChange = (e) => {
    const value = e.target.value;
    setSelectedProyek(value);
    if (!value) {
      setTukangList([]);
      setKehadiran({});
    }
  };

  const handleSubmitAbsenTim = async (e) => {
    e.preventDefault();
    if (!selectedProyek) return alert("Silakan pilih lokasi proyek terlebih dahulu.");
    if (tukangList.length === 0) return alert("Tidak ada data pekerja pada proyek ini untuk dikirim.");

    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Sesi login tidak ditemukan. Coba login ulang.");

      const waktuSekarang = new Date().toISOString();

      // Susun data untuk di-insert sekaligus (Bulk Insert)
      const absenPayload = tukangList.map(tukang => ({
        mandor_id: user.id,
        proyek_id: selectedProyek,
        tukang_id: tukang.id,
        keterangan: kehadiran[tukang.id] || 'Hadir',
        waktu_absen: waktuSekarang
      }));

      const { error } = await supabase.from('absen_tukang').insert(absenPayload);
      if (error) throw error;

      alert('Data absensi tim hari ini berhasil disimpan.');
      setSelectedProyek(''); 
      setTukangList([]);
    } catch (error) {
      alert('Gagal menyimpan absen tim: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* Brand Navbar with Centered Title "Dashboard Admin Tukang" */}
      <Navbar 
        title="Dashboard Admin Tukang" 
        userRole={userRole || 'admin_tukang'} 
        onEditProfile={() => setShowEditModal(true)} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Konten Utama Absen Tim Pekerja */}
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-8 rounded-3xl shadow-[0_15px_40px_-15px_rgba(15,23,42,0.08)] border border-slate-200 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#CE2328]"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-0.5">Absensi Tim Pekerja</h3>
              <p className="text-xs text-slate-500">Pilih proyek lokasi kerja lalu tandai status kehadiran setiap pekerja.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Absen Diri Saya</span>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              Pilih Lokasi Proyek:
            </label>
            <div className="relative">
              <select 
                value={selectedProyek} 
                onChange={handleProyekChange}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Pilih Proyek --</option>
                {proyekList.map(proyek => (
                  <option key={proyek.id} value={proyek.id}>{proyek.nama_proyek}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-slate-500 text-sm font-semibold animate-pulse flex flex-col items-center gap-2">
              <svg className="w-6 h-6 animate-spin text-[#CE2328]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memuat daftar pekerja proyek...</span>
            </div>
          )}

          {selectedProyek && !isLoading && tukangList.length === 0 && (
            <div className="text-center p-8 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-semibold">
              Belum ada pekerja yang ditugaskan ke proyek ini.
            </div>
          )}

          {selectedProyek && !isLoading && tukangList.length > 0 && (
            <form onSubmit={handleSubmitAbsenTim} className="animate-fade-in">
              <div className="mb-8 space-y-3">
                {tukangList.map(tukang => (
                  <div key={tukang.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all gap-3 shadow-sm">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-[#CE2328] border border-red-100 flex items-center justify-center font-bold text-sm shrink-0">
                        {tukang.nama_tukang?.charAt(0) || 'T'}
                      </div>
                      <span className="font-bold text-slate-800 text-sm sm:text-base truncate">{tukang.nama_tukang}</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
                      {[
                        { key: 'Hadir', label: 'Hadir', bg: 'peer-checked:bg-[#82C341] peer-checked:text-slate-950' },
                        { key: 'Izin', label: 'Izin', bg: 'peer-checked:bg-amber-500 peer-checked:text-slate-950' },
                        { key: 'Sakit', label: 'Sakit', bg: 'peer-checked:bg-[#CE2328] peer-checked:text-white' }
                      ].map(st => (
                        <label key={st.key} className="flex-1 sm:flex-none cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${tukang.id}`}
                            value={st.key}
                            checked={kehadiran[tukang.id] === st.key}
                            onChange={() => handleStatusChange(tukang.id, st.key)}
                            className="sr-only peer"
                          />
                          <div className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 bg-white border border-slate-300 text-center transition-all shadow-sm ${st.bg}`}>
                            {st.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`w-full py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#CE2328] hover:bg-[#b41c21] text-white shadow-xl shadow-[#CE2328]/30 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <span>Merekam Data Tim...</span>
                ) : (
                  <span>Kirim Rekap Absensi Tim Hari Ini</span>
                )}
              </button>
            </form>
          )}
        </div>

      </main>

      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
      />
    </div>
  );
};

export default DashboardTukang;