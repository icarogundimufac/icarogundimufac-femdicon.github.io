import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  title: string
  subtitle?: string
  badge?: string
  className?: string
  children?: React.ReactNode
}

export function Header({ title, subtitle, className, children }: HeaderProps) {
  return (
    <header className={cn('w-full', className)}>
      <div className="relative bg-[#1F6B3A]">
        <div className="px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white font-fraunces leading-none">
              {title}
            </h1>
            {subtitle && (
              <span className="text-xs text-white/50 font-jakarta hidden sm:block">{subtitle}</span>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-3 text-white/50 text-xs font-jakarta flex-shrink-0">
              {children}
            </div>
          )}
        </div>
      </div>
      <div className="h-[3px] bg-[#F2C230]" />
    </header>
  )
}
