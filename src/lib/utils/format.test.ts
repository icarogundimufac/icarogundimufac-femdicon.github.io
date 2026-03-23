import {
  formatCompactCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/utils/format'

describe('format utils', () => {
  it('formata números em pt-BR', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formata percentuais', () => {
    expect(formatPercent(84.3)).toBe('84,3%')
  })

  it('compacta moeda em milhões', () => {
    expect(formatCompactCurrency(1250000)).toBe('R$ 1,3 mi')
  })
})
