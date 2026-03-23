export interface NavItem {
  label: string
  href: string
  icon: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    label: 'Visão Geral',
    items: [
      { label: 'Dashboard', href: '/', icon: 'grid' },
    ],
  },
  {
    label: 'Indicadores',
    items: [
      { label: 'Educação', href: '/educacao', icon: 'book-open' },
      { label: 'Saúde', href: '/saude', icon: 'heart-pulse' },
      { label: 'Segurança', href: '/seguranca', icon: 'shield' },
      { label: 'Orçamento', href: '/orcamento', icon: 'coins' },
    ],
  },
  {
    label: 'Território',
    items: [
      { label: 'Municípios', href: '/municipios', icon: 'building' },
    ],
  },
]
