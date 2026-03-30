// Xenith Capital investment strategies — sourced from xenithcapital.co.uk/strategies

export interface Strategy {
  code: string
  name: string
  series: 'XQS' | 'XNS' | 'XXS'
  description: string
  minInvestment?: number
}

export const STRATEGIES: Strategy[] = [
  // QUANT Series — FX & Commodities
  { code: 'XQS-4.4',   series: 'XQS', name: 'Flagship Multi-Strategy',    description: '44 subsystems · 26.72% ROI · -14.88% max DD',   minInvestment: 10000 },
  { code: 'XQS-0.4',   series: 'XQS', name: 'Concentrated FX/Metals',     description: '4 subsystems · 54.57% ROI · -17.76% max DD' },
  { code: 'XQS-0.9',   series: 'XQS', name: 'Swing Trading',              description: '9 subsystems · 157.59% ROI · -11.20% max DD' },
  { code: 'XQS-1.4',   series: 'XQS', name: 'Diversified',                description: '14 subsystems · 20.95% ROI · -19.55% max DD' },
  { code: 'XQS-1.4.1', series: 'XQS', name: 'High-Volume',                description: '14 subsystems · ~1,300 trades/mo · 28.97% ROI' },
  { code: 'XQS-1.7',   series: 'XQS', name: 'Defensive',                  description: '17 subsystems · 11.62% ROI' },
  { code: 'XQS-2.2',   series: 'XQS', name: 'Dynamic Adaptive',           description: '22 subsystems · 15.12% ROI · -18.94% max DD' },
  { code: 'XQS-3.0',   series: 'XQS', name: 'Breadth-Focused',            description: '30+ subsystems · 51.92% ROI · -14.20% max DD' },
  // NOVA Series — Cryptocurrency
  { code: 'XNS-2.0',   series: 'XNS', name: 'Bitcoin/Ethereum',           description: '8 subsystems · ~1,100 trades/mo · 9.97% ROI' },
  // XCHANGE Series — Multi-Asset
  { code: 'XXS-1.4',   series: 'XXS', name: 'FX/Commodities',             description: '14 subsystems · 28.13% ROI · -15.32% max DD' },
  { code: 'XXS-2.0',   series: 'XXS', name: 'Cross-Asset',                description: '20 subsystems · ~1,000 trades/mo · 34.02% ROI' },
  { code: 'XXS-2.1',   series: 'XXS', name: 'Institutional Multi-Asset',  description: 'FX, commodities, ETFs, indices, stocks · 23.23% ROI' },
]

export const STRATEGY_SERIES = [
  { key: 'XQS', label: 'QUANT Series (FX & Commodities)' },
  { key: 'XNS', label: 'NOVA Series (Cryptocurrency)' },
  { key: 'XXS', label: 'XCHANGE Series (Multi-Asset)' },
]

export function getStrategy(code: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.code === code)
}
