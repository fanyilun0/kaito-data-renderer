// 已发行代币配置
// 在这个列表中的ticker代表该项目已发行代币
export const issuedTokenStation = [
  'ARB',
  'PYTH',
  'NEWTON',
  'DYDX',
  'PEAQ',
  'INIT',
  'MNT',
  'WETH',
  'HOME',
]

// 检查某个ticker是否已发行代币
export function isTokenIssued(ticker: string): boolean {
  return issuedTokenStation.includes(ticker.toUpperCase())
}
