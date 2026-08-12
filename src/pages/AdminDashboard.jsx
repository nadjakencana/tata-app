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
    
    const dateObj = new Date(waktuAbsen);
    if (isNaN(dateObj.getTime())) return false;

    // Format waktuAbsen ke tanggal lokal YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    // Jika user memilih tanggal spesifik dari datepicker
    if (filterTanggal) {
      return localDateStr === filterTanggal;
    }

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

  // --- HELPER STRUKTUR FILTER UNTUK METADATA EKSPOR ---
  const getFilterInfo = (isTukang = false) => {
    const info = [];
    if (filterTanggal) {
      info.push(`Tanggal: ${filterTanggal}`);
    } else if (filterRentang === '7_hari') {
      info.push('Rentang: 7 Hari Terakhir');
    } else if (filterRentang === '30_hari') {
      info.push('Rentang: 1 Bulan Terakhir');
    } else {
      info.push('Rentang: Semua Waktu');
    }

    if (isTukang && filterProyek) {
      info.push(`Proyek: ${filterProyek}`);
    }

    if (searchNama.trim()) {
      info.push(`Pencarian: "${searchNama.trim()}"`);
    }

    return info.join(' | ');
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
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Filter Aktif: ${getFilterInfo(false)}`, 14, 21);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 26);

    const tableData = filteredKaryawan.map((item, index) => [
      index + 1,
      item.profiles?.nama_lengkap || 'Anonim',
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleDateString('id-ID') : '-',
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-',
      item.latitude && item.longitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : '-'
    ]);

    autoTable(doc, {
      startY: 31,
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

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Filter Aktif: ${getFilterInfo(true)}`, 14, 21);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 26);

    const tableData = filteredTukang.map((item, index) => [
      index + 1,
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleDateString('id-ID') : '-',
      item.waktu_absen ? new Date(item.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-',
      item.tukang?.nama_tukang || 'Tukang Dihapus',
      item.proyek?.nama_proyek || 'Proyek Dihapus',
      item.keterangan || 'Hadir'
    ]);

    autoTable(doc, {
      startY: 31,
      head: [['No', 'Tanggal', 'Jam Absen', 'Nama Pekerja', 'Lokasi Proyek', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [130, 195, 65] },
    });

    doc.save(`Laporan_Absen_Tukang_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* Sleek Top Navbar */}
      <Navbar 
        title="Admin Panel" 
        userRole="super_admin" 
        onEditProfile={() => setShowEditModal(true)} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header Title & Quick Overview Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Rekapitulasi Absensi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Monitoring data kehadiran karyawan & tim tukang secara real-time.
            </p>
          </div>

          {/* Segmented Control Tabs */}
          <div className="inline-flex bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 shadow-xs self-stretch sm:self-auto">
            <button 
              onClick={() => setActiveTab('karyawan')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'karyawan' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Absen Karyawan ({filteredKaryawan.length})
            </button>
            
            <button 
              onClick={() => setActiveTab('tukang')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tukang' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Absen Tukang ({filteredTukang.length})
            </button>

            <button 
              onClick={() => setActiveTab('master')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'master' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Master Data
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-500 font-semibold animate-pulse flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <svg className="w-7 h-7 animate-spin text-[#CE2328]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs text-slate-600">Memuat data absensi terbaru...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB 1: ABSEN KARYAWAN */}
            {activeTab === 'karyawan' && (
              <div className="space-y-6">
                {/* Control & Filter Panel */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#CE2328]"></div>
                      <h3 className="text-sm font-bold text-slate-800">Filter Data Absen Karyawan</h3>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={exportKaryawanExcel}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                      </button>
                      <button 
                        onClick={exportKaryawanPDF}
                        className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Cari Karyawan</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Nama..." 
                          value={searchNama}
                          onChange={(e) => setSearchNama(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Rentang Waktu</label>
                      <select
                        value={filterRentang}
                        onChange={(e) => {
                          setFilterRentang(e.target.value);
                          setFilterTanggal('');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                      >
                        <option value="semua">Semua Waktu</option>
                        <option value="7_hari">7 Hari Terakhir</option>
                        <option value="30_hari">1 Bulan Terakhir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal Spesifik</label>
                      <input 
                        type="date" 
                        value={filterTanggal}
                        onChange={(e) => {
                          setFilterTanggal(e.target.value);
                          setFilterRentang('custom');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-end">
                      <button 
                        onClick={resetAllFilter}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl border border-slate-200 transition-colors text-xs"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabel Berdasarkan Hari */}
                {groupedKaryawan.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl text-slate-400 border border-slate-200/80 text-xs font-medium shadow-xs">
                    Data absensi karyawan tidak ditemukan.
                  </div>
                ) : (
                  groupedKaryawan.map((group) => (
                    <div key={group.dateKey} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-slate-300">
                      <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                            {group.formattedDate}
                          </h4>
                        </div>
                        <span className="text-[11px] bg-slate-200/70 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full">
                          {group.items.length} Karyawan
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                              <th className="px-5 py-3 font-semibold">Nama Lengkap</th>
                              <th className="px-5 py-3 font-semibold">Waktu Absen</th>
                              <th className="px-5 py-3 font-semibold text-center">Bukti Foto</th>
                              <th className="px-5 py-3 font-semibold text-center">Lokasi GPS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {group.items.map((absen) => (
                              <tr key={absen.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-slate-800">
                                  {absen.profiles?.nama_lengkap || 'Anonim'}
                                </td>
                                <td className="px-5 py-3.5 text-slate-600 font-mono font-medium">
                                  {new Date(absen.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  {absen.foto_url ? (
                                    <div className="flex justify-center items-center">
                                      <img 
                                        src={absen.foto_url} 
                                        alt="Bukti" 
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 hover:scale-110 transition-transform cursor-pointer shadow-xs" 
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  {absen.latitude && absen.longitude ? (
                                    <a 
                                      href={`https://www.google.com/maps?q=${absen.latitude},${absen.longitude}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      Maps
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
                {/* Control & Filter Panel */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#82C341]"></div>
                      <h3 className="text-sm font-bold text-slate-800">Filter Data Absen Tukang</h3>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={exportTukangExcel}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                      </button>
                      <button 
                        onClick={exportTukangPDF}
                        className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Cari Pekerja</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Nama..." 
                          value={searchNama}
                          onChange={(e) => setSearchNama(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Rentang Waktu</label>
                      <select
                        value={filterRentang}
                        onChange={(e) => {
                          setFilterRentang(e.target.value);
                          setFilterTanggal('');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                      >
                        <option value="semua">Semua Waktu</option>
                        <option value="7_hari">7 Hari Terakhir</option>
                        <option value="30_hari">1 Bulan Terakhir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal Spesifik</label>
                      <input 
                        type="date" 
                        value={filterTanggal}
                        onChange={(e) => {
                          setFilterTanggal(e.target.value);
                          setFilterRentang('custom');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Filter Proyek</label>
                      <select 
                        value={filterProyek}
                        onChange={(e) => setFilterProyek(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
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
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl border border-slate-200 transition-colors text-xs"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabel Berdasarkan Hari */}
                {groupedTukang.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl text-slate-400 border border-slate-200/80 text-xs font-medium shadow-xs">
                    Data absensi tukang tidak ditemukan.
                  </div>
                ) : (
                  groupedTukang.map((group) => (
                    <div key={group.dateKey} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-slate-300">
                      <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                            {group.formattedDate}
                          </h4>
                        </div>
                        <span className="text-[11px] bg-slate-200/70 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full">
                          {group.items.length} Pekerja
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                              <th className="px-5 py-3 font-semibold">Waktu Absen</th>
                              <th className="px-5 py-3 font-semibold">Nama Tukang</th>
                              <th className="px-5 py-3 font-semibold">Lokasi Proyek</th>
                              <th className="px-5 py-3 font-semibold">Status Kehadiran</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {group.items.map((absen) => (
                              <tr key={absen.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-3.5 text-slate-600 font-mono font-medium">
                                  {absen.waktu_absen ? new Date(absen.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                                </td>
                                <td className="px-5 py-3.5 font-bold text-slate-800">
                                  {absen.tukang?.nama_tukang || 'Tukang Dihapus'}
                                </td>
                                <td className="px-5 py-3.5 font-medium text-slate-700">
                                  <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-[11px]">
                                    {absen.proyek?.nama_proyek || 'Proyek Dihapus'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                    absen.keterangan === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                                    absen.keterangan === 'Izin' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 
                                    'bg-rose-50 text-rose-700 border border-rose-200/60'
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