import { useState } from "react";
import MasterProyek from "./MasterProyek";
import MasterTukang from "./MasterTukang";

const MasterData = () => {
  const [activeTab, setActiveTab] = useState("proyek");

  return (
    <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_-15px_rgba(15,23,42,0.08)] border border-slate-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Pengelolaan Data Master</h2>
          <p className="text-xs text-slate-500 mt-1">Tambah, ubah, atau hapus data lokasi proyek dan data pekerja / tukang</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("proyek")}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "proyek" 
                ? "bg-[#CE2328] text-white shadow-md shadow-[#CE2328]/25" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Data Proyek
          </button>
          <button
            onClick={() => setActiveTab("tukang")}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "tukang" 
                ? "bg-[#82C341] text-slate-950 shadow-md shadow-[#82C341]/30" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Data Pekerja / Tukang
          </button>
        </div>
      </div>

      {/* Area Konten Tab */}
      <div className="animate-fade-in">
        {activeTab === "proyek" ? <MasterProyek /> : <MasterTukang />}
      </div>
    </div>
  );
};

export default MasterData;