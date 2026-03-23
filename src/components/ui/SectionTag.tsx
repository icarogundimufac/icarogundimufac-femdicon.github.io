import { cn } from '@/lib/utils/cn'

const TAG_COLORS: Record<string, string> = {
  educacao: 'bg-blue-50 text-blue-700 border-blue-200',
  saude: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  seguranca: 'bg-orange-50 text-orange-700 border-orange-200',
  orcamento: 'bg-amber-50 text-amber-700 border-amber-200',
  municipios: 'bg-purple-50 text-purple-700 border-purple-200',
  default: 'bg-areia-100 text-areia-700 border-areia-200',
}

const SECTION_LABELS: Record<string, string> = {
  educacao: 'Educação',
  saude: 'Saúde',
  seguranca: 'Segurança',
  orcamento: 'Orçamento',
  municipios: 'Municípios',
}

interface SectionTagProps {
  section: string
  className?: string
}

export function SectionTag({ section, className }: SectionTagProps) {
  const colorClass = TAG_COLORS[section] ?? TAG_COLORS.default
  const label = SECTION_LABELS[section] ?? section

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border font-jakarta',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  )
}
