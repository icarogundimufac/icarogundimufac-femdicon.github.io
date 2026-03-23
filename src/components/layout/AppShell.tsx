import { Sidebar } from '@/components/layout/Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-[60px] bg-white flex items-center justify-between px-6 border-b-[3px] border-[#FDC82F]">
        <div className="flex items-center gap-4">
          <img
            src="/seplan.svg"
            alt="SEPLAN — Secretaria de Estado de Planejamento"
            width={168}
            height={48}
            className="h-12 w-auto"
          />
          <div className="w-px h-8 bg-[#FDC82F]" />
          <span className="text-base font-bold text-[#1F6B3A] font-jakarta leading-tight hidden md:block">
            Portal de Indicadores
            <br />
            do Estado do Acre
          </span>
        </div>
      </header>

      <div className="flex min-h-screen pt-[60px]">
        <Sidebar />
        <main className="flex-1 ml-[260px] min-h-screen bg-areia-100">
          {children}
        </main>
      </div>
    </>
  )
}
