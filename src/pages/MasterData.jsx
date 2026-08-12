import { useState } from "react";
import MasterProyek from "./MasterProyek";
import MasterTukang from "./MasterTukang";

const MasterData = () => {
  const [activeTab, setActiveTab] = useState("proyek");

  return (
    <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
      
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Pengelolaan Master Data
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Kelola daftar lokasi proyek konstruksi dan data penugasan pekerja / tukang.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="inline-flex bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 shadow-xs self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab("proyek")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "proyek" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Data Proyek
          </button>
          <button
            onClick={() => setActiveTab("tukang")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "tukang" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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