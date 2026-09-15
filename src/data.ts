export type Bounty = {
  id: number
  title: string
  description: string
  category: string
  raised: number
  target: number
  daysLeft: number
  votes: number
  submissions: number
  creator: string
  featured?: boolean
  accent: 'purple' | 'yellow' | 'cyan' | 'pink'
}

export const demoBounties: Bounty[] = [
  {
    id: 1,
    title: 'BOT Chain analytics dashboard',
    description: 'Build an open-source analytics suite for tracking protocol activity, wallets, and ecosystem growth.',
    category: 'Analytics',
    raised: 8240,
    target: 10000,
    daysLeft: 4,
    votes: 142,
    submissions: 7,
    creator: '0x71F2...9A40',
    featured: true,
    accent: 'purple',
  },
  {
    id: 2,
    title: 'Zero-knowledge identity kit',
    description: 'A reusable SDK for private, sybil-resistant community membership proofs across BOT Chain apps.',
    category: 'Infrastructure',
    raised: 12500,
    target: 18000,
    daysLeft: 8,
    votes: 98,
    submissions: 4,
    creator: '0x3Be8...11C2',
    accent: 'yellow',
  },
  {
    id: 3,
    title: 'DAO contributor onboarding',
    description: 'Create an interactive learning path that gets new contributors from wallet setup to first proposal.',
    category: 'Community',
    raised: 3900,
    target: 7500,
    daysLeft: 11,
    votes: 76,
    submissions: 12,
    creator: '0xA921...0E8D',
    accent: 'cyan',
  },
  {
    id: 4,
    title: 'Mobile-first block explorer',
    description: 'Design and ship a lightweight explorer experience optimized for low bandwidth and small screens.',
    category: 'Developer tools',
    raised: 6100,
    target: 15000,
    daysLeft: 15,
    votes: 54,
    submissions: 3,
    creator: '0xE430...B901',
    accent: 'pink',
  },
]

export const leaders = [
  { rank: 1, name: 'pixelcraft', address: '0x4Fc2...91A0', earned: '14,820', wins: 8, hue: '#A855F7' },
  { rank: 2, name: 'bytebender', address: '0x88C1...3F72', earned: '11,400', wins: 6, hue: '#FACC15' },
  { rank: 3, name: 'solstice', address: '0x1D07...A826', earned: '9,750', wins: 5, hue: '#22D3EE' },
  { rank: 4, name: 'web3wanderer', address: '0x6A91...2E40', earned: '7,200', wins: 4, hue: '#FB7185' },
]
