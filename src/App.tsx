import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Award, Check, ChevronDown, CircleDollarSign, Clock3, Code2,
  ExternalLink, Menu, Plus, Search, ShieldCheck, Sparkles,
  Trophy, Users, Vote, Wallet, X, LogOut,
} from 'lucide-react'
import { createPublicClient, createWalletClient, custom, formatEther, http, parseEther } from 'viem'
import { botChainTestnet, bountyHubAbi, contractAddress, isContractConfigured } from './contract'
import { Bounty, demoBounties, leaders } from './data'

type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
declare global { interface Window { ethereum?: EthereumProvider } }

const short = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
const accents = ['purple', 'yellow', 'cyan', 'pink'] as const

function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null)
  const [bounties, setBounties] = useState<Bounty[]>(demoBounties)
  const [activeNav, setActiveNav] = useState('Bounties')
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<'create' | 'fund' | 'details' | null>(null)
  const [selected, setSelected] = useState<Bounty | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const publicClient = useMemo(() => createPublicClient({ chain: botChainTestnet, transport: http() }), [])

  useEffect(() => {
    if (!isContractConfigured) return
    void (async () => {
      try {
        const count = await publicClient.readContract({ address: contractAddress, abi: bountyHubAbi, functionName: 'bountyCount' })
        const items = await Promise.all(Array.from({ length: Number(count) }, async (_, index) => {
          const id = index + 1
          const item = await publicClient.readContract({ address: contractAddress, abi: bountyHubAbi, functionName: 'bounties', args: [BigInt(id)] })
          return {
            id, creator: short(item[0]), title: item[1], description: item[2], category: item[3],
            daysLeft: Math.max(0, Math.ceil((Number(item[4]) * 1000 - Date.now()) / 86_400_000)),
            target: Number(formatEther(item[5])), raised: Number(formatEther(item[6])),
            submissions: Number(item[7]), votes: Number(item[8]), accent: accents[index % accents.length],
          } satisfies Bounty
        }))
        if (items.length) setBounties(items)
      } catch { setNotice('Could not read the deployed contract. Showing preview data.') }
    })()
  }, [publicClient])

  async function connectWallet(): Promise<`0x${string}` | null> {
    if (!window.ethereum) {
      setNotice('No EVM wallet found. Install a compatible wallet to continue.')
      return null
    }
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{ chainId: '0x3c8', chainName: 'BOT Chain Testnet', nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 }, rpcUrls: ['https://rpc.bohr.life'], blockExplorerUrls: ['https://scan.bohr.life'] }],
      })
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as `0x${string}`[]
      setAccount(accounts[0])
      setNotice('Wallet connected to BOT Chain Testnet.')
      return accounts[0]
    } catch { setNotice('Wallet connection was cancelled.'); return null }
  }

  function disconnectWallet() {
    setAccount(null)
    setNotice('Wallet disconnected from BountyHub.')
  }

  async function write(functionName: 'createBounty' | 'fundBounty' | 'submitWork' | 'vote' | 'selectWinner' | 'claimReward', args: readonly unknown[], value?: bigint) {
    const activeAccount = account || await connectWallet()
    if (!activeAccount) throw new Error('Connect a wallet to continue.')
    if (!window.ethereum || !isContractConfigured) throw new Error('Contract address is not configured yet.')
    const wallet = createWalletClient({ account: activeAccount, chain: botChainTestnet, transport: custom(window.ethereum) })
    const hash = await wallet.writeContract({ address: contractAddress, abi: bountyHubAbi, functionName, args, value } as never)
    await publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  const visible = bounties.filter((b) =>
    (filter === 'All' || b.category === filter) &&
    `${b.title} ${b.description} ${b.category}`.toLowerCase().includes(query.toLowerCase()),
  )

  const stats = {
    funded: bounties.reduce((sum, b) => sum + b.raised, 0),
    builders: bounties.reduce((sum, b) => sum + b.submissions, 0),
    votes: bounties.reduce((sum, b) => sum + b.votes, 0),
  }

  function openFund(bounty: Bounty) { setSelected(bounty); setModal('fund') }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="nav-wrap">
        <a className="brand" href="#top" onClick={() => setActiveNav('Bounties')}>
          <span className="brand-mark"><span /></span><strong>Bounty<span>Hub</span></strong>
        </a>
        <nav className={mobileNav ? 'nav-links open' : 'nav-links'}>
          {['Bounties', 'How it works', 'Leaderboard'].map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} className={activeNav === item ? 'active' : ''} onClick={() => { setActiveNav(item); setMobileNav(false) }}>{item}</a>)}
        </nav>
        <div className="nav-actions">
          <span className="network-pill"><i /> BOT Testnet</span>
          {account ? <div className="connected-wallet"><span><i />{short(account)}</span><button className="disconnect-button" onClick={disconnectWallet} aria-label="Disconnect wallet" title="Disconnect wallet"><LogOut size={16} /><b>Disconnect</b></button></div> : <button className="wallet-button" onClick={connectWallet}><Wallet size={17} /> Connect wallet</button>}
          <button className="menu-button" aria-label="Toggle menu" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow"><Sparkles size={14} /> COMMUNITY-POWERED BUILDING</div>
          <h1>Communities fund<br /><em>what gets built.</em></h1>
          <p>Discover ideas, pool resources, and vote for the builders who bring the best work to life—fully onchain.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setModal('create')}><Plus size={18} /> Create a bounty</button>
            <a href="#bounties" className="ghost-button">Explore bounties <ArrowRight size={18} /></a>
          </div>
          <div className="trust-row"><span><ShieldCheck size={16} /> Onchain escrow</span><span><Vote size={16} /> Community voted</span><span><Award size={16} /> Permissionless rewards</span></div>
        </section>

        <section className="stats-strip" aria-label="Platform stats">
          <Stat icon={<CircleDollarSign />} label="Total funded" value={`${stats.funded.toLocaleString()} BOT`} />
          <Stat icon={<Code2 />} label="Active builders" value={String(stats.builders)} />
          <Stat icon={<Vote />} label="Votes cast" value={stats.votes.toLocaleString()} />
          <Stat icon={<Trophy />} label="Bounties shipped" value="36" />
        </section>

        <section className="board section" id="bounties">
          <div className="section-heading"><div><span className="kicker">LIVE OPPORTUNITIES</span><h2>Fund the next big idea</h2></div><a href="#bounties">View all <ArrowRight size={16} /></a></div>
          <div className="toolbar">
            <div className="filters">{['All', 'Infrastructure', 'Developer tools', 'Community'].map((item) => <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
            <label className="search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bounties" /></label>
          </div>
          <div className="bounty-grid">
            {visible.map((bounty) => <BountyCard bounty={bounty} key={bounty.id} onFund={() => openFund(bounty)} onOpen={() => { setSelected(bounty); setModal('details') }} />)}
            {!visible.length && <div className="empty-state"><Search /><h3>No bounties found</h3><p>Try a different filter or search phrase.</p></div>}
          </div>
        </section>

        <section className="how section" id="how-it-works">
          <div className="section-heading centered"><div><span className="kicker">SIMPLE BY DESIGN</span><h2>From idea to impact</h2><p>Four transparent steps. One community decision.</p></div></div>
          <div className="steps">
            <Step number="01" icon={<Plus />} title="Create" text="Define the work, funding target, and voting deadline." />
            <Step number="02" icon={<CircleDollarSign />} title="Fund" text="Back the ideas you believe deserve to exist." />
            <Step number="03" icon={<Vote />} title="Vote" text="Review submissions and choose the strongest work." />
            <Step number="04" icon={<Award />} title="Reward" text="Winning builders claim the pooled BOT onchain." />
          </div>
        </section>

        <section className="leaderboard section" id="leaderboard">
          <div className="section-heading"><div><span className="kicker">TOP CONTRIBUTORS</span><h2>Builders making an impact</h2></div><span className="season"><i /> Season 01</span></div>
          <div className="leader-card">
            <div className="leader-head"><span>Rank & contributor</span><span>Bounties won</span><span>Rewards earned</span></div>
            {leaders.map((leader) => <div className="leader-row" key={leader.rank}><div className="person"><b>#{leader.rank}</b><span className="avatar" style={{ '--hue': leader.hue } as React.CSSProperties}>{leader.name[0].toUpperCase()}</span><span><strong>{leader.name}</strong><small>{leader.address}</small></span></div><span className="wins">{leader.wins}</span><strong className="earned">{leader.earned} <small>BOT</small></strong></div>)}
          </div>
        </section>

        <section className="cta section"><div><span className="kicker">YOUR IDEA COULD BE NEXT</span><h2>Ready to build together?</h2><p>Create a bounty or fund a builder. Every contribution moves the ecosystem forward.</p></div><button className="yellow-button" onClick={() => setModal('create')}>Launch a bounty <ArrowRight size={18} /></button></section>
      </main>

      <footer><a className="brand" href="#top"><span className="brand-mark"><span /></span><strong>Bounty<span>Hub</span></strong></a><p>Community-funded development on BOT Chain.</p><div><a href="https://scan.bohr.life" target="_blank">Explorer <ExternalLink size={13} /></a><a href="https://github.com/BOTChain-bot" target="_blank"><Code2 size={15} /> GitHub</a></div></footer>

      {notice && <div className="toast"><Check size={17} /><span>{notice}</span><button onClick={() => setNotice(null)}><X size={16} /></button></div>}
      {modal === 'create' && <CreateModal onClose={() => setModal(null)} busy={busy} onSubmit={async (data) => {
        setBusy(true)
        try {
          await write('createBounty', [data.title, data.description, data.category, parseEther(data.target), BigInt(Math.floor(new Date(data.deadline).getTime() / 1000))], parseEther(data.seed || '0'))
          setNotice('Bounty created on BOT Chain Testnet.')
          setModal(null)
        } catch (e) { setNotice(e instanceof Error ? e.message : 'Transaction failed.') } finally { setBusy(false) }
      }} />}
      {modal === 'fund' && selected && <FundModal bounty={selected} busy={busy} onClose={() => setModal(null)} onSubmit={async (amount) => {
        setBusy(true)
        try {
          await write('fundBounty', [BigInt(selected.id)], parseEther(amount))
          setNotice(`You funded “${selected.title}”.`); setModal(null)
        } catch (e) { setNotice(e instanceof Error ? e.message : 'Transaction failed.') } finally { setBusy(false) }
      }} />}
      {modal === 'details' && selected && <DetailsModal bounty={selected} busy={busy} onClose={() => setModal(null)} onAction={async (action, args) => {
        setBusy(true)
        try {
          await write(action, args)
          const messages = { submitWork: 'Work submission recorded.', vote: 'Vote recorded onchain.', selectWinner: 'Winning submission finalized.', claimReward: 'Reward claimed successfully.' }
          setNotice(messages[action]); setModal(null)
        } catch (e) { setNotice(e instanceof Error ? e.message : 'Transaction failed.') } finally { setBusy(false) }
      }} />}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="stat"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div> }

function BountyCard({ bounty, onFund, onOpen }: { bounty: Bounty; onFund: () => void; onOpen: () => void }) {
  const progress = Math.min(100, Math.round((bounty.raised / bounty.target) * 100))
  return <article className={`bounty-card ${bounty.accent}`}>
    <div className="card-top"><span className="category">{bounty.category}</span>{bounty.featured && <span className="featured"><Sparkles size={12} /> Featured</span>}<button aria-label="Open bounty" onClick={onOpen}><ArrowRight size={18} /></button></div>
    <h3>{bounty.title}</h3><p>{bounty.description}</p>
    <div className="meta"><span><Clock3 size={15} /> {bounty.daysLeft} days left</span><span><Vote size={15} /> {bounty.votes} votes</span><span><Users size={15} /> {bounty.submissions} builds</span></div>
    <div className="funding"><div><span><strong>{bounty.raised.toLocaleString()}</strong> BOT raised</span><span>{progress}%</span></div><div className="progress"><i style={{ width: `${progress}%` }} /></div><small>Goal: {bounty.target.toLocaleString()} BOT</small></div>
    <div className="card-footer"><span>by <b>{bounty.creator}</b></span><button onClick={onFund}>Fund bounty <ArrowRight size={15} /></button></div>
  </article>
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) { return <article className="step"><span className="step-number">{number}</span><span className="step-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article> }

type CreateData = { title: string; description: string; category: string; target: string; seed: string; deadline: string }
function CreateModal({ onClose, onSubmit, busy }: { onClose: () => void; onSubmit: (data: CreateData) => void; busy: boolean }) {
  const tomorrow = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); onSubmit(Object.fromEntries(f) as CreateData) }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modal-title"><div><span className="kicker">NEW OPPORTUNITY</span><h2>Create a bounty</h2></div><button type="button" onClick={onClose}><X /></button></div><label>Title<input name="title" required maxLength={120} placeholder="What should the community build?" /></label><label>Description<textarea name="description" required maxLength={1500} placeholder="Describe the problem, outcome, and acceptance criteria." /></label><div className="field-row"><label>Category<span className="select-wrap"><select name="category"><option>Infrastructure</option><option>Developer tools</option><option>Community</option><option>Analytics</option></select><ChevronDown /></span></label><label>Voting deadline<input name="deadline" type="date" min={tomorrow} defaultValue={tomorrow} required /></label></div><div className="field-row"><label>Funding target (BOT)<input name="target" type="number" min="0.01" step="0.01" placeholder="10,000" required /></label><label>Seed funding (BOT)<input name="seed" type="number" min="0" step="0.01" defaultValue="0" /></label></div><div className="modal-note"><ShieldCheck size={17} /><span>Funds are held by the smart contract until the community-selected winner claims them.</span></div><button className="primary-button submit" disabled={busy}>{busy ? 'Confirming…' : 'Create on testnet'} <ArrowRight size={17} /></button></form></div>
}

function FundModal({ bounty, onClose, onSubmit, busy }: { bounty: Bounty; onClose: () => void; onSubmit: (amount: string) => void; busy: boolean }) {
  const [amount, setAmount] = useState('100')
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal compact" onSubmit={(e) => { e.preventDefault(); onSubmit(amount) }}><div className="modal-title"><div><span className="kicker">BACK THIS IDEA</span><h2>Fund bounty</h2></div><button type="button" onClick={onClose}><X /></button></div><div className="selected-bounty"><span>{bounty.category}</span><strong>{bounty.title}</strong><small>{bounty.raised.toLocaleString()} / {bounty.target.toLocaleString()} BOT raised</small></div><label>Contribution amount<div className="amount-input"><input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /><span>BOT</span></div></label><div className="quick-amounts">{['50', '100', '500', '1000'].map((n) => <button type="button" className={amount === n ? 'active' : ''} onClick={() => setAmount(n)} key={n}>{n}</button>)}</div><button className="primary-button submit" disabled={busy || !Number(amount)}>{busy ? 'Confirming…' : `Fund ${Number(amount || 0).toLocaleString()} BOT`} <ArrowRight size={17} /></button><small className="testnet-copy">BOT Chain Testnet · Test tokens have no monetary value</small></form></div>
}

type BountyAction = 'submitWork' | 'vote' | 'selectWinner' | 'claimReward'
function DetailsModal({ bounty, onClose, onAction, busy }: { bounty: Bounty; onClose: () => void; onAction: (action: BountyAction, args: readonly unknown[]) => void; busy: boolean }) {
  const [proof, setProof] = useState('')
  const [submission, setSubmission] = useState('1')
  const [tab, setTab] = useState<'vote' | 'submit'>('vote')
  const progress = Math.min(100, Math.round((bounty.raised / bounty.target) * 100))
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal details-modal">
    <div className="modal-title"><div><span className="kicker">BOUNTY #{bounty.id}</span><h2>{bounty.title}</h2></div><button onClick={onClose}><X /></button></div>
    <p className="detail-description">{bounty.description}</p>
    <div className="detail-stats"><span><Clock3 /> <b>{bounty.daysLeft}</b><small>days left</small></span><span><Users /> <b>{bounty.submissions}</b><small>submissions</small></span><span><Vote /> <b>{bounty.votes}</b><small>votes cast</small></span></div>
    <div className="funding"><div><span><strong>{bounty.raised.toLocaleString()}</strong> BOT raised</span><span>{progress}%</span></div><div className="progress"><i style={{ width: `${progress}%`, background: '#a855f7' }} /></div><small>Goal: {bounty.target.toLocaleString()} BOT</small></div>
    <div className="action-tabs"><button className={tab === 'vote' ? 'active' : ''} onClick={() => setTab('vote')}>Cast vote</button><button className={tab === 'submit' ? 'active' : ''} onClick={() => setTab('submit')}>Submit work</button></div>
    {tab === 'vote' ? <form className="action-form" onSubmit={(e) => { e.preventDefault(); onAction('vote', [BigInt(bounty.id), BigInt(submission)]) }}><label>Submission ID<input type="number" min="1" value={submission} onChange={(e) => setSubmission(e.target.value)} required /></label><button className="primary-button" disabled={busy}>Vote for submission #{submission}</button></form> : <form className="action-form" onSubmit={(e) => { e.preventDefault(); onAction('submitWork', [BigInt(bounty.id), proof]) }}><label>Proof of work URL or IPFS URI<input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="ipfs://… or https://github.com/…" required /></label><button className="primary-button" disabled={busy}>Submit work</button></form>}
    <div className="finalize-actions"><span>After voting closes</span><div><button disabled={busy} onClick={() => onAction('selectWinner', [BigInt(bounty.id)])}>Select winner</button><button disabled={busy} onClick={() => onAction('claimReward', [BigInt(bounty.id)])}>Claim reward</button></div></div>
    <small className="testnet-copy">Actions are validated by the BountyHub contract on BOT Chain Testnet.</small>
  </div></div>
}

export default App
