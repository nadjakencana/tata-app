import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const MasterProyek = () => {
  const [proyekList, setProyekList] = useState([]);
  const [namaProyek, setNamaProyek] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchProyek = async () => {
    const { data, error } = await supabase.from("proyek").select("*").order("id", { ascending: true });
    if (!error) setProyekList(data || []);
  };

  useEffect(() => {
    let ignore = false;
    const loadProyek = async () => {
      const { data, error } = await supabase.from("proyek").select("*").order("id", { ascending: true });
      if (!ignore && !error) setProyekList(data || []);
    };
    loadProyek();
    return () => {
      ignore = true; 
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNama = namaProyek.trim();
    if (!cleanNama) return alert("Silakan masukkan nama proyek!");

    if (editId) {
      // Update data
      const { error } = await supabase.from("proyek").update({ nama_proyek: cleanNama }).eq("id", editId);
      if (error) {
        alert("Gagal mengubah data proyek: " + error.message);
      } else {
        setEditId(null);
        setNamaProyek("");
        fetchProyek();
      }
    } else {
      // Insert data baru
      const { error } = await supabase.from("proyek").insert([{ nama_proyek: cleanNama }]);
      if (error) {
        alert("Gagal menambah proyek: " + error.message);
      } else {
        setNamaProyek("");
        fetchProyek();
      }
    }
  };

  const handleEdit = (proyek) => {
    setEditId(proyek.id);
    setNamaProyek(proyek.nama_proyek);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus proyek ini?")) {
      const { error } = await supabase.from("proyek").delete().eq("id", id);
      if (error) {
        alert("Gagal menghapus proyek: " + error.message);
      } else {
        fetchProyek();
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Daftar Proyek Konstruksi
        </h3>
        <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
          {proyekList.length} Proyek Terdaftar
        </span>
      </div>
      
      {/* Form Tambah/Edit */}
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/80">
        <input
          type="text"
          placeholder="Nama Proyek Baru (contoh: Proyek Ruko BSD Cluster A)..."
          value={namaProyek}
          onChange={(e) => setNamaProyek(e.target.value)}
          required
          className="flex-1 min-w-0 w-full px-3.5 py-2 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
        />
        <button 
          type="submit" 
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {editId ? "Simpan Perubahan" : "Tambah Proyek"}
        </button>
        {editId && (
          <button 
            type="button" 
            onClick={() => { setEditId(null); setNamaProyek(""); }} 
            className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-2 rounded-lg text-xs transition-colors shrink-0"
          >
            Batal
          </button>
        )}
      </form>

      {/* Tabel Data */}
      <div className="rounded-xl border border-slate-200/80 overflow-x-auto shadow-xs max-w-full bg-white">
        <table className="w-full min-w-[500px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="px-5 py-3 font-semibold w-20">ID</th>
              <th className="px-5 py-3 font-semibold">Nama Proyek</th>
              <th className="px-5 py-3 font-semibold text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {proyekList.map((proyek) => (
              <tr key={proyek.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5 text-slate-400 font-mono font-medium">#{proyek.id}</td>
                <td className="px-5 py-3.5 font-bold text-slate-800 text-xs">{proyek.nama_proyek}</td>
                <td className="px-5 py-3.5 text-center space-x-1.5">
                  <button 
                    onClick={() => handleEdit(proyek)} 
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(proyek.id)} 
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {proyekList.length === 0 && (
              <tr>
                <td colSpan="3" className="px-5 py-8 text-center text-slate-400 text-xs font-medium">
                  Belum ada data proyek. Silakan tambahkan proyek baru di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterProyek;