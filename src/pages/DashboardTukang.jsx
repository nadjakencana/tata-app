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
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
    };
    fetchRole();
  }, []);

  // --- MENGAMBIL DAFTAR PROYEK SAAT LOAD ---
  useEffect(() => {
    const fetchProyek = async () => {
      const { data, error } = await supabase.from('proyek').select('*').order('nama_proyek');
      if (!error && data) setProyekList(data);
    };
    fetchProyek();
  }, []);

  // --- MENGAMBIL DAFTAR TUKANG BERDASARKAN PROYEK ---
  useEffect(() => {
    if (!selectedProyek) {
      return;
    }
    
    const fetchTukang = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tukang')
        .select('*')
        .eq('proyek_id', selectedProyek)
        .order('nama_tukang');
        
      if (!error && data) {
        setTukangList(data);
        // Set default semua hadir
        const defaultKehadiran = {};
        data.forEach(t => defaultKehadiran[t.id] = 'Hadir');
        setKehadiran(defaultKehadiran);
      }
      setIsLoading(false);
    };
    fetchTukang();
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
    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

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
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_-15px_rgba(15,23,42,0.08)] border border-slate-200 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#CE2328]"></div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Absensi Tim Pekerja</h3>
            <p className="text-xs text-slate-500">Pilih proyek lokasi kerja lalu tandai status kehadiran setiap pekerja.</p>
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
                  <div key={tukang.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all gap-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#CE2328] border border-red-100 flex items-center justify-center font-bold text-sm">
                        {tukang.nama_tukang?.charAt(0) || 'T'}
                      </div>
                      <span className="font-bold text-slate-800 text-base">{tukang.nama_tukang}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
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
                          <div className={`px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 bg-white border border-slate-300 text-center transition-all shadow-sm ${st.bg}`}>
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