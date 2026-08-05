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
    if (editId) {
      // Update data
      const { error } = await supabase.from("proyek").update({ nama_proyek: namaProyek }).eq("id", editId);
      if (!error) {
        setEditId(null);
        setNamaProyek("");
        fetchProyek();
      }
    } else {
      // Insert data baru
      const { error } = await supabase.from("proyek").insert([{ nama_proyek: namaProyek }]);
      if (!error) {
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
      await supabase.from("proyek").delete().eq("id", id);
      fetchProyek();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#CE2328]"></span>
          Daftar Proyek Konstruksi
        </h3>
        <span className="text-xs font-semibold text-slate-500">{proyekList.length} Proyek Terdaftar</span>
      </div>
      
      {/* Form Tambah/Edit */}
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <input
          type="text"
          placeholder="Nama Proyek Baru (contoh: Proyek Ruko BSD Cluster A)..."
          value={namaProyek}
          onChange={(e) => setNamaProyek(e.target.value)}
          required
          className="flex-1 p-3 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#CE2328] text-sm font-medium"
        />
        <button 
          type="submit" 
          className="bg-[#CE2328] hover:bg-[#b41c21] text-white px-5 py-3 rounded-xl font-extrabold text-xs shadow-md shadow-[#CE2328]/25 transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {editId ? "Simpan Perubahan" : "Tambah Proyek"}
        </button>
        {editId && (
          <button 
            type="button" 
            onClick={() => { setEditId(null); setNamaProyek(""); }} 
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
              <th className="p-4 font-extrabold">Nama Proyek</th>
              <th className="p-4 font-extrabold text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proyekList.map((proyek) => (
              <tr key={proyek.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 text-xs font-mono font-bold text-slate-500">#{proyek.id}</td>
                <td className="p-4 font-bold text-slate-800 text-sm">{proyek.nama_proyek}</td>
                <td className="p-4 text-center space-x-2">
                  <button 
                    onClick={() => handleEdit(proyek)} 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(proyek.id)} 
                    className="bg-red-50 hover:bg-[#CE2328] text-[#CE2328] hover:text-white border border-red-200 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {proyekList.length === 0 && (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400 text-sm">
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