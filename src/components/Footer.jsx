export default function Footer() {
  return (
    <footer className="mt-auto py-8 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-white rounded-lg shadow-sm border border-slate-100">
              <img src="/logo-tata.png" alt="TATA Logo" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-[#CE2328] text-base tracking-tight">TATA</span>
                <span className="text-xs font-semibold text-slate-500">| Building Solution</span>
              </div>
              <p className="text-xs text-slate-600">Sistem Absensi & Management Konstruksi</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
            <span className="inline-block w-2 h-2 rounded-full bg-[#82C341]"></span>
            <span>&copy; {new Date().getFullYear()} PT. TATA Building Solution. All rights reserved.</span>
          </div>

        </div>
      </div>
    </footer>
  )
}
