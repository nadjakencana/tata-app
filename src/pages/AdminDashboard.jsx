import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom' 
import MasterData from './MasterData'
import EditProfileModal from '../components/EditProfileModal'
import Navbar from '../components/Navbar'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('karyawan') // 'karyawan', 'tukang', 'master'
  const [dataAbsenKaryawan, setDataAbsenKaryawan] = useState([])
  const [dataAbsenTukang, setDataAbsenTukang] = useState([])
  const [proyekList, setProyekList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // State untuk Filter
  const [searchNama, setSearchNama] = useState('')
  const [filterRentang, setFilterRentang] = useState('semua') // 'semua', '7_hari', '30_hari'
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterProyek, setFilterProyek] = useState('')

  const navigate = useNavigate() 

  useEffect(() => {
    let ignore = false

    const loadAllData = async () => {
      try {
        const [proyekRes, karyawanRes, tukangRes] = await Promise.all([
          supabase.from('proyek').select('nama_proyek'),
          supabase.from('absen_karyawan').select(`
            id, waktu_absen, latitude, longitude, foto_url,
            profiles ( nama_lengkap )
          `).order('waktu_absen', { ascending: false }),
          supabase.from('absen_tukang').select(`
            id, keterangan, waktu_absen,
            proyek ( nama_proyek ),
            tukang ( nama_tukang )
          `).order('waktu_absen', { ascending: false })
        ])

        if (ignore) return

        if (proyekRes.data) setProyekList(proyekRes.data)
        if (karyawanRes.data) setDataAbsenKaryawan(karyawanRes.data)
        if (tukangRes.data) setDataAbsenTukang(tukangRes.data)
      } catch (error) {
        console.error("Gagal ambil data:", error.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadAllData()

    return () => {
      ignore = true
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // --- HELPER FILTER TANGGAL / RENTANG WAKTU ---
  const matchFilterTanggal = (waktuAbsen) => {
    if (!waktuAbsen) return false;
    
    // Jika user memilih tanggal spesifik dari datepicker
    if (filterTanggal) {
      return waktuAbsen.substring(0, 10) === filterTanggal;
    }

    // Jika user memilih opsi rentang waktu
    const dateObj = new Date(waktuAbsen);
    if (isNaN(dateObj.getTime())) return false;

    if (filterRentang === '7_hari') {
      const past7Days = new Date();
      past7Days.setDate(past7Days.getDate() - 7);
      past7Days.setHours(0, 0, 0, 0);
      return dateObj >= past7Days;
    }

    if (filterRentang === '30_hari') {
      const past30Days = new Date();
      past30Days.setDate(past30Days.getDate() - 30);
      past30Days.setHours(0, 0, 0, 0);
      return dateObj >= past30Days;
    }

    return true; // 'semua'
  };

  // --- LOGIKA FILTERING DATA ---
  const filteredKaryawan = dataAbsenKaryawan.filter(absen => {
    const matchNama = (absen.profiles?.nama_lengkap || '').toLowerCase().includes(searchNama.toLowerCase());
    const matchWaktu = matchFilterTanggal(absen.waktu_absen);
    return matchNama && matchWaktu;
  });

  const filteredTukang = dataAbsenTukang.filter(absen => {
    const matchNama = (absen.tukang?.nama_tukang || '').toLowerCase().includes(searchNama.toLowerCase());
    const matchProyek = filterProyek ? absen.proyek?.nama_proyek === filterProyek : true;
    const matchWaktu = matchFilterTanggal(absen.waktu_absen);
    return matchNama && matchProyek && matchWaktu;
  });

  // --- LOGIKA PENGELOMPOKAN DATA BERDASARKAN HARI ---
  const groupDataByDay = (items) => {
    const groupsMap = {}
    
    items.forEach(item => {
      if (!item.waktu_absen) return
      const dateObj = new Date(item.waktu_absen)
      if (isNaN(dateObj.getTime())) return

      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`

      const formattedDate = dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      if (!groupsMap[dateKey]) {
        groupsMap[dateKey] = {
          dateKey,
          formattedDate,
          items: []
        }
      }
      groupsMap[dateKey].items.push(item)
    })

    return Object.values(groupsMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }

  const groupedKaryawan = groupDataByDay(filteredKaryawan)
  const groupedTukang = groupDataByDay(filteredTukang)

  const resetAllFilter = () => {
    setSearchNama('');
    setFilterRentang('semua');
    setFilterTanggal('');
    setFilterProyek('');
  };

  // --- FUNGSI EKSPOR EXCEL & PDF ---
  const exportKaryawanExcel = () => {
    if (filteredKaryawan.length === 0) return alert('Tidak ada data absensi karyawan untuk diekspor.');
    
    const exportData = filteredKaryawan.map((item, index) => ({
      'No': index + 1,
      'Nama Lengkap': item.profiles?.nama_lengkap || 'Anonim',
      'Tanggal': item.waktu_absen ? new Date(item.waktu_absen).toLocaleDateString('id-ID') : '-',
      'Jam Absen': item.waktu_absen ? new Date(item.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-',
      'Koordinat GPS': item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : '-',
      'Link Foto Bukti': item.foto_url || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absen Karyawan');
    XLSX.writeFile(workbook, `Laporan_Absen_Karyawan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportKaryawanPDF = () => {
    if (filteredKaryawan.length === 0) return alert('Tidak ada data absensi karyawan untuk diekspor.');

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN ABSENSI KARYAWAN', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const tableData = filteredKaryawan.map((item, index) => [
      index + 1,
      item.profiles?.nama_lengkap || 'Anonim',
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleDateString('id-ID') : '-',
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-',
      item.latitude && item.longitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : '-'
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['No', 'Nama Lengkap', 'Tanggal', 'Jam Absen', 'Koordinat GPS']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [206, 35, 40] },
    });

    doc.save(`Laporan_Absen_Karyawan_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportTukangExcel = () => {
    if (filteredTukang.length === 0) return alert('Tidak ada data absensi tukang untuk diekspor.');

    const exportData = filteredTukang.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.waktu_absen ? new Date(item.waktu_absen).toLocaleDateString('id-ID') : '-',
      'Jam Absen': item.waktu_absen ? new Date(item.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-',
      'Nama Pekerja': item.tukang?.nama_tukang || 'Tukang Dihapus',
      'Lokasi Proyek': item.proyek?.nama_proyek || 'Proyek Dihapus',
      'Status': item.keterangan || 'Hadir'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absen Tukang');
    XLSX.writeFile(workbook, `Laporan_Absen_Tukang_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportTukangPDF = () => {
    if (filteredTukang.length === 0) return alert('Tidak ada data absensi tukang untuk diekspor.');

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN ABSENSI PEKERJA / TUKANG', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const tableData = filteredTukang.map((item, index) => [
      index + 1,
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleDateString('id-ID') : '-',
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-',
      item.tukang?.nama_tukang || 'Tukang Dihapus',
      item.proyek?.nama_proyek || 'Proyek Dihapus',
      item.keterangan || 'Hadir'
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['No', 'Tanggal', 'Jam Absen', 'Nama Pekerja', 'Lokasi Proyek', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [130, 195, 65] },
    });

    doc.save(`Laporan_Absen_Tukang_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* Simple Header Navbar with centered title "Admin Panel" */}
      <Navbar 
        title="Admin Panel" 
        userRole="super_admin" 
        onEditProfile={() => setShowEditModal(true)} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Simple Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl mb-6 border border-slate-300/70 shadow-inner flex-col sm:flex-row gap-1 sm:gap-0">
          <button 
            onClick={() => setActiveTab('karyawan')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
              activeTab === 'karyawan' 
                ? 'bg-[#CE2328] text-white shadow-lg shadow-[#CE2328]/25' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Absen Karyawan
          </button>
          
          <button 
            onClick={() => setActiveTab('tukang')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
              activeTab === 'tukang' 
                ? 'bg-[#82C341] text-slate-950 shadow-lg shadow-[#82C341]/30' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Absen Tukang
          </button>

          <button 
            onClick={() => setActiveTab('master')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
              activeTab === 'master' 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Master Data
          </button>
        </div>
        
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-bold animate-pulse flex flex-col items-center gap-3">
            <svg className="w-8 h-8 animate-spin text-[#CE2328]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Memuat data absensi...</span>
          </div>
        ) : (
          <div>
            
            {/* TAB 1: ABSEN KARYAWAN */}
            {activeTab === 'karyawan' && (
              <div className="space-y-6">
                {/* PANEL FILTER KARYAWAN */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-100 pb-4 gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Filter Absen Karyawan</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={exportKaryawanExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        Export Excel
                      </button>
                      <button 
                        onClick={exportKaryawanPDF}
                        className="bg-[#CE2328] hover:bg-[#b41c21] text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#CE2328]/20 flex items-center gap-1.5"
                      >
                        Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Cari Nama</label>
                      <input 
                        type="text" 
                        placeholder="Ketik nama karyawan..." 
                        value={searchNama}
                        onChange={(e) => setSearchNama(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rentang Waktu</label>
                      <select
                        value={filterRentang}
                        onChange={(e) => {
                          setFilterRentang(e.target.value);
                          setFilterTanggal('');
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
                      >
                        <option value="semua">Semua Waktu</option>
                        <option value="7_hari">7 Hari Terakhir</option>
                        <option value="30_hari">1 Bulan Terakhir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tanggal Spesifik</label>
                      <input 
                        type="date" 
                        value={filterTanggal}
                        onChange={(e) => {
                          setFilterTanggal(e.target.value);
                          setFilterRentang('custom');
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div className="flex items-end">
                      <button 
                        onClick={resetAllFilter}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 rounded-xl border border-slate-300 transition-colors text-xs"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIWAYAT BERDASARKAN HARI */}
                {groupedKaryawan.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-3xl text-slate-400 border border-slate-200 font-medium">
                    Data absensi karyawan tidak ditemukan.
                  </div>
                ) : (
                  groupedKaryawan.map((group) => (
                    <div key={group.dateKey} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#CE2328]"></span>
                          {group.formattedDate}
                        </h4>
                        <span className="text-xs text-slate-400 font-semibold">{group.items.length} Absen</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                              <th className="p-4 font-extrabold">Nama Lengkap</th>
                              <th className="p-4 font-extrabold">Jam Absen</th>
                              <th className="p-4 font-extrabold text-center">Foto Bukti</th>
                              <th className="p-4 font-extrabold text-center">GPS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.items.map((absen) => (
                              <tr key={absen.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 font-bold text-slate-800">
                                  {absen.profiles?.nama_lengkap || 'Anonim'}
                                </td>
                                <td className="p-4 text-slate-600 text-sm font-mono font-medium">
                                  {new Date(absen.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </td>
                                <td className="p-4 text-center">
                                  {absen.foto_url ? (
                                    <div className="flex justify-center items-center">
                                      <img 
                                        src={absen.foto_url} 
                                        alt="Bukti" 
                                        className="w-12 h-12 object-cover rounded-xl border border-slate-300 hover:scale-125 transition-transform cursor-pointer shadow-sm" 
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {absen.latitude && absen.longitude ? (
                                    <a 
                                      href={`https://www.google.com/maps?q=${absen.latitude},${absen.longitude}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all"
                                    >
                                      Peta GPS
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 text-xs">N/A</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: ABSEN TUKANG */}
            {activeTab === 'tukang' && (
              <div className="space-y-6">
                {/* PANEL FILTER TUKANG */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-100 pb-4 gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Filter Absen Tukang</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={exportTukangExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        Export Excel
                      </button>
                      <button 
                        onClick={exportTukangPDF}
                        className="bg-[#CE2328] hover:bg-[#b41c21] text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#CE2328]/20 flex items-center gap-1.5"
                      >
                        Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nama Pekerja</label>
                      <input 
                        type="text" 
                        placeholder="Ketik nama..." 
                        value={searchNama}
                        onChange={(e) => setSearchNama(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rentang Waktu</label>
                      <select
                        value={filterRentang}
                        onChange={(e) => {
                          setFilterRentang(e.target.value);
                          setFilterTanggal('');
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
                      >
                        <option value="semua">Semua Waktu</option>
                        <option value="7_hari">7 Hari Terakhir</option>
                        <option value="30_hari">1 Bulan Terakhir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tanggal Spesifik</label>
                      <input 
                        type="date" 
                        value={filterTanggal}
                        onChange={(e) => {
                          setFilterTanggal(e.target.value);
                          setFilterRentang('custom');
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Filter Proyek</label>
                      <select 
                        value={filterProyek}
                        onChange={(e) => setFilterProyek(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CE2328] focus:bg-white transition-all font-medium"
                      >
                        <option value="">Semua Proyek</option>
                        {proyekList.map((p, idx) => (
                          <option key={idx} value={p.nama_proyek}>{p.nama_proyek}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button 
                        onClick={resetAllFilter}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 rounded-xl border border-slate-300 transition-colors text-xs"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIWAYAT TUKANG BERDASARKAN HARI */}
                {groupedTukang.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-3xl text-slate-400 border border-slate-200 font-medium">
                    Data absensi tukang tidak ditemukan.
                  </div>
                ) : (
                  groupedTukang.map((group) => (
                    <div key={group.dateKey} className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#82C341]"></span>
                          {group.formattedDate}
                        </h4>
                        <span className="text-xs text-slate-400 font-semibold">{group.items.length} Pekerja Absen</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                              <th className="p-4 font-extrabold">Jam Absen</th>
                              <th className="p-4 font-extrabold">Nama Tukang</th>
                              <th className="p-4 font-extrabold">Lokasi Proyek</th>
                              <th className="p-4 font-extrabold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.items.map((absen) => (
                              <tr key={absen.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 text-slate-600 text-sm font-mono font-medium">
                                  {absen.waktu_absen ? new Date(absen.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                                </td>
                                <td className="p-4 font-bold text-slate-800">
                                  {absen.tukang?.nama_tukang || 'Tukang Dihapus'}
                                </td>
                                <td className="p-4 font-semibold text-slate-700">
                                  <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
                                    {absen.proyek?.nama_proyek || 'Proyek Dihapus'}
                                  </span>
                                </td>
                                <td className="p-4 font-bold">
                                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                                    absen.keterangan === 'Hadir' ? 'bg-[#82C341]/20 text-[#5e9626] border border-[#82C341]/40' : 
                                    absen.keterangan === 'Izin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 
                                    'bg-red-100 text-[#CE2328] border border-red-300'
                                  }`}>
                                    {absen.keterangan}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: KELOLA MASTER DATA */}
            {activeTab === 'master' && (
              <div className="animate-fade-in">
                <MasterData />
              </div>
            )}

          </div>
        )}
      </main>

      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
      />
    </div>
  )
}