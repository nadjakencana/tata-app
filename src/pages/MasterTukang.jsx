import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const MasterTukang = () => {
  const [tukangList, setTukangList] = useState([]);
  const [proyekList, setProyekList] = useState([]); // Untuk menyimpan daftar proyek di dropdown
  const [namaTukang, setNamaTukang] = useState("");
  const [proyekId, setProyekId] = useState(""); // State untuk menyimpan proyek_id yang dipilih
  const [editId, setEditId] = useState(null);

  const fetchTukang = async () => {
    const { data, error } = await supabase.from("tukang").select("*").order("id", { ascending: true });
    if (!error && data) setTukangList(data);
  };

  useEffect(() => {
    let ignore = false;
    const loadAll = async () => {
      const [pRes, tRes] = await Promise.all([
        supabase.from("proyek").select("*"),
        supabase.from("tukang").select("*").order("id", { ascending: true })
      ]);
      if (ignore) return;
      if (!pRes.error && pRes.data) {
        setProyekList(pRes.data);
        if (pRes.data.length > 0) setProyekId(pRes.data[0].id);
      }
      if (!tRes.error && tRes.data) {
        setTukangList(tRes.data);
      }
    };
    loadAll();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const parsedProyekId = parseInt(proyekId, 10);
    if (isNaN(parsedProyekId)) {
      alert("Silakan pilih proyek yang valid!");
      return;
    }

    // Payload disesuaikan dengan kolom di Supabase: nama_tukang dan proyek_id
    const payload = { 
      nama_tukang: namaTukang, 
      proyek_id: parsedProyekId
    }; 

    if (editId) {
      const { error } = await supabase.from("tukang").update(payload).eq("id", editId);
      if (!error) {
        setEditId(null);
        setNamaTukang("");
        if (proyekList.length > 0) setProyekId(proyekList[0].id);
        fetchTukang();
      } else {
        alert("Gagal update data pekerja: " + error.message);
      }
    } else {
      const { error } = await supabase.from("tukang").insert([payload]);
      if (!error) {
        setNamaTukang("");
        if (proyekList.length > 0) setProyekId(proyekList[0].id);
        fetchTukang();
      } else {
        alert("Gagal menambah data pekerja: " + error.message);
      }
    }
  };

  const handleEdit = (tukang) => {
    setEditId(tukang.id);
    setNamaTukang(tukang.nama_tukang);
    setProyekId(tukang.proyek_id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus pekerja ini?")) {
      const { error } = await supabase.from("tukang").delete().eq("id", id);
      if (error) {
        alert("Gagal menghapus pekerja: " + error.message);
      } else {
        fetchTukang();
      }
    }
  };

  // Fungsi kecil untuk mencari nama proyek berdasarkan ID
  const getNamaProyek = (id) => {
    const proyek = proyekList.find(p => p.id === id);
    return proyek ? proyek.nama_proyek : "Tidak diketahui";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Daftar Pekerja / Tukang
        </h3>
        <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
          {tukangList.length} Pekerja Terdaftar
        </span>
      </div>
      
      {/* Form Tambah/Edit */}
      <form onSubmit={handleSubmit} className="flex gap-2.5 flex-wrap sm:flex-nowrap bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/80">
        <input
          type="text"
          placeholder="Nama Lengkap Pekerja..."
          value={namaTukang}
          onChange={(e) => setNamaTukang(e.target.value)}
          required
          className="flex-1 min-w-0 w-full px-3.5 py-2 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
        />
        
        {/* Dropdown untuk memilih Proyek */}
        <select 
          value={proyekId} 
          onChange={(e) => setProyekId(e.target.value)}
          required
          className="w-full sm:w-auto min-w-0 px-3.5 py-2 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all cursor-pointer"
        >
          <option value="" disabled>Pilih Proyek Penugasan...</option>
          {proyekList.map((proyek) => (
            <option key={proyek.id} value={proyek.id}>
              {proyek.nama_proyek}
            </option>
          ))}
        </select>

        <button 
          type="submit" 
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {editId ? "Simpan Perubahan" : "Tambah Pekerja"}
        </button>

        {editId && (
          <button 
            type="button" 
            onClick={() => { setEditId(null); setNamaTukang(""); }} 
            className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-2 rounded-lg text-xs transition-colors shrink-0"
          >
            Batal
          </button>
        )}
      </form>

      {/* Tabel Data */}
      <div className="rounded-xl border border-slate-200/80 overflow-x-auto shadow-xs max-w-full bg-white">
        <table className="w-full min-w-[550px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="px-5 py-3 font-semibold w-20">ID</th>
              <th className="px-5 py-3 font-semibold">Nama Tukang</th>
              <th className="px-5 py-3 font-semibold">Lokasi Penugasan Proyek</th>
              <th className="px-5 py-3 font-semibold text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {tukangList.map((tukang) => (
              <tr key={tukang.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5 text-slate-400 font-mono font-medium">#{tukang.id}</td>
                <td className="px-5 py-3.5 font-bold text-slate-800 text-xs">{tukang.nama_tukang}</td>
                <td className="px-5 py-3.5">
                  <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-medium inline-block">
                    {getNamaProyek(tukang.proyek_id)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center space-x-1.5">
                  <button 
                    onClick={() => handleEdit(tukang)} 
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(tukang.id)} 
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {tukangList.length === 0 && (
              <tr>
                <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-xs font-medium">
                  Belum ada data pekerja. Silakan tambahkan pekerja baru di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterTukang;