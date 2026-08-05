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
        alert("Gagal update data");
      }
    } else {
      const { error } = await supabase.from("tukang").insert([payload]);
      if (!error) {
        setNamaTukang("");
        if (proyekList.length > 0) setProyekId(proyekList[0].id);
        fetchTukang();
      } else {
        alert("Gagal tambah data");
      }
    }
  };

  const handleEdit = (tukang) => {
    setEditId(tukang.id);
    setNamaTukang(tukang.nama_tukang); // Pakai nama_tukang
    setProyekId(tukang.proyek_id);     // Pakai proyek_id
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus pekerja ini?")) {
      await supabase.from("tukang").delete().eq("id", id);
      fetchTukang();
    }
  };

  // Fungsi kecil untuk mencari nama proyek berdasarkan ID
  const getNamaProyek = (id) => {
    const proyek = proyekList.find(p => p.id === id);
    return proyek ? proyek.nama_proyek : "Tidak diketahui";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#82C341]"></span>
          Daftar Pekerja / Tukang
        </h3>
        <span className="text-xs font-semibold text-slate-500">{tukangList.length} Pekerja Terdaftar</span>
      </div>
      
      {/* Form Tambah/Edit */}
      <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap sm:flex-nowrap bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <input
          type="text"
          placeholder="Nama Lengkap Pekerja..."
          value={namaTukang}
          onChange={(e) => setNamaTukang(e.target.value)}
          required
          className="flex-1 p-3 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#82C341] text-sm font-medium"
        />
        
        {/* Dropdown untuk memilih Proyek */}
        <select 
          value={proyekId} 
          onChange={(e) => setProyekId(e.target.value)}
          required
          className="p-3 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#82C341] text-sm font-medium cursor-pointer"
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
          className="bg-[#82C341] hover:bg-[#71ab35] text-slate-950 px-5 py-3 rounded-xl font-extrabold text-xs shadow-md shadow-[#82C341]/25 transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {editId ? "Simpan Perubahan" : "Tambah Pekerja"}
        </button>

        {editId && (
          <button 
            type="button" 
            onClick={() => { setEditId(null); setNamaTukang(""); }} 
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-3 rounded-xl text-xs transition-colors"
          >
            Batal
          </button>
        )}
      </form>

      {/* Tabel Data */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-extrabold w-20">ID</th>
              <th className="p-4 font-extrabold">Nama Tukang</th>
              <th className="p-4 font-extrabold">Lokasi Penugasan Proyek</th>
              <th className="p-4 font-extrabold text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tukangList.map((tukang) => (
              <tr key={tukang.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 text-xs font-mono font-bold text-slate-500">#{tukang.id}</td>
                <td className="p-4 font-bold text-slate-800 text-sm">{tukang.nama_tukang}</td>
                <td className="p-4">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-extrabold inline-block">
                    {getNamaProyek(tukang.proyek_id)}
                  </span>
                </td>
                <td className="p-4 text-center space-x-2">
                  <button 
                    onClick={() => handleEdit(tukang)} 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(tukang.id)} 
                    className="bg-red-50 hover:bg-[#CE2328] text-[#CE2328] hover:text-white border border-red-200 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {tukangList.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400 text-sm">
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