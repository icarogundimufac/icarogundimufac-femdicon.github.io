export interface SectionMeta {
  id: string
  label: string
  href: string
  description: string
  color: string
  bgColor: string
  icon: 'book-open' | 'heart-pulse' | 'shield' | 'landmark'
}

export const SECTIONS: SectionMeta[] = [
  {
    id: 'educacao',
    label: 'Educação',
    href: '/educacao',
    description: 'Matrículas, IDEB, alfabetização e infraestrutura escolar',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: 'book-open',
  },
  {
    id: 'saude',
    label: 'Saúde',
    href: '/saude',
    description: 'Mortalidade, cobertura vacinal, leitos e profissionais de saúde',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: 'heart-pulse',
  },
  {
    id: 'seguranca',
    label: 'Segurança',
    href: '/seguranca',
    description: 'Homicídios, roubos, furtos e ocorrências policiais',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: 'shield',
  },
  {
    id: 'orcamento',
    label: 'Orçamento',
    href: '/orcamento',
    description: 'Receitas, despesas, investimentos e transferências',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    icon: 'landmark',
  },
]

export function getSectionMeta(id: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.id === id)
}
