import { SidebarNav } from './SidebarNav'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-[60px] h-[calc(100vh-60px)] w-[260px] bg-[#1F6B3A] flex flex-col z-30 shadow-2xl">
      {/* Navigation */}
      <SidebarNav />

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#3E8B4F]/60">
        <p className="text-[10px] text-white/40 font-jakarta leading-relaxed">
          Governo do Estado do Acre
        </p>
        <p className="text-[10px] text-white/25 font-jakarta">
          © {new Date().getFullYear()} SEPLAN/AC
        </p>
      </div>
    </aside>
  )
}
