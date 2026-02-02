import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { homeService } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './HomeAnalysis.css'

const METROS = ['Tampa', 'Orlando', 'Jacksonville']
const METRO_COLORS = { Tampa: '#477d8f', Orlando: '#1b1b1b', Jacksonville: '#7f8c8d' }

const HomeAnalysis = () => {
  const [searchParams] = useSearchParams()
  const [listings, setListings] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMetro, setFilterMetro] = useState(searchParams.get('metro') || '')
  const [filterBeds, setFilterBeds] = useState('')
  const [filterType, setFilterType] = useState(searchParams.get('propertyType') || '')
  const [sortBy, setSortBy] = useState('dealScore')
  const [chartType, setChartType] = useState('single_family')
  const [savedIds, setSavedIds] = useState(new Set())
  const [excludedIds, setExcludedIds] = useState(new Set())

  const sortOpts = {
    dealScore: { label: 'Deal Score', key: 'dealScore', desc: true },
    price_asc: { label: 'Price (Low)', key: 'price', desc: false },
    price_desc: { label: 'Price (High)', key: 'price', desc: true },
    dom: { label: 'Days on Market', key: 'daysOnMarket', desc: true },
    ppsqft: { label: '$/sqft (Low)', key: 'pricePerSqft', desc: false }
  }

  const loadData = useCallback(async () => {
    try {
      const params = {}
      if (filterMetro) params.metro = filterMetro
      if (filterBeds) params.beds = filterBeds
      if (filterType) params.propertyType = filterType
      const [listRes, analyticsRes, historyRes] = await Promise.all([
        homeService.getAllHomeListings(params),
        homeService.getHomeAnalytics(filterMetro ? { metro: filterMetro } : {}),
        homeService.getMarketHistory({})
      ])
      let data = listRes.data.listings || []
      const opt = sortOpts[sortBy]
      data.sort((a, b) => {
        const va = parseFloat(a[opt.key]) || 0
        const vb = parseFloat(b[opt.key]) || 0
        return opt.desc ? vb - va : va - vb
      })
      setListings(data)
      setAnalytics(analyticsRes.data)
      setHistory(historyRes.data.snapshots || [])
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }, [filterMetro, filterBeds, filterType, sortBy])

  useEffect(() => { loadData(); loadSavedIds(); loadExcludedIds() }, [loadData])

  const loadSavedIds = async () => {
    try { const res = await homeService.getMySavedIds(); setSavedIds(new Set(res.data.ids)) } catch (e) { console.error(e) }
  }
  const toggleSave = async (e, id) => {
    e.stopPropagation()
    try {
      if (savedIds.has(id)) { await homeService.unsaveProperty(id); setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n }) }
      else { await homeService.saveProperty(id); setSavedIds(prev => new Set(prev).add(id)) }
    } catch (err) { console.error(err) }
  }
  const loadExcludedIds = async () => {
    try { const res = await homeService.getMyExcludedIds(); setExcludedIds(new Set(res.data.ids)) } catch (e) { console.error(e) }
  }
  const toggleExclude = async (e, id) => {
    e.stopPropagation()
    try {
      if (excludedIds.has(id)) { await homeService.unexcludeProperty(id); setExcludedIds(prev => { const n = new Set(prev); n.delete(id); return n }) }
      else { await homeService.excludeProperty(id); setExcludedIds(prev => new Set(prev).add(id)) }
    } catch (err) { console.error(err) }
  }

  const fmt = (v) => {
    const n = parseFloat(v); if (isNaN(n)) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
  }
  const sc = (score) => {
    if (score >= 70) return { bg: '#1b1b1b', color: '#ffffff' }
    if (score >= 50) return { bg: '#e8f4f8', color: '#1c4d5a' }
    return { bg: '#f0f0f0', color: '#5e5e5e' }
  }

  // Build chart data from history snapshots
  const priceChartData = useMemo(() => {
    const filtered = history.filter(s => s.propertyType === chartType)
    const byPeriod = {}
    for (const s of filtered) {
      if (!byPeriod[s.period]) byPeriod[s.period] = { period: s.period }
      byPeriod[s.period][s.metro] = Math.round(parseFloat(s.avgPrice) || 0)
    }
    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period))
  }, [history, chartType])

  const ppsqftChartData = useMemo(() => {
    const filtered = history.filter(s => s.propertyType === chartType)
    const byPeriod = {}
    for (const s of filtered) {
      if (!byPeriod[s.period]) byPeriod[s.period] = { period: s.period }
      byPeriod[s.period][s.metro] = Math.round(parseFloat(s.avgPricePerSqft) || 0)
    }
    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period))
  }, [history, chartType])

  const domChartData = useMemo(() => {
    const filtered = history.filter(s => s.propertyType === chartType)
    const byPeriod = {}
    for (const s of filtered) {
      if (!byPeriod[s.period]) byPeriod[s.period] = { period: s.period }
      byPeriod[s.period][s.metro] = Math.round(parseFloat(s.avgDOM) || 0)
    }
    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period))
  }, [history, chartType])

  // Price distribution from current listings
  const priceDistribution = useMemo(() => {
    const ranges = [
      { label: '<$100K', min: 0, max: 100000 },
      { label: '$100-150K', min: 100000, max: 150000 },
      { label: '$150-200K', min: 150000, max: 200000 },
      { label: '$200-250K', min: 200000, max: 250000 },
      { label: '$250-350K', min: 250000, max: 350000 },
      { label: '$350-500K', min: 350000, max: 500000 },
      { label: '$500K+', min: 500000, max: Infinity }
    ]
    return ranges.map(r => {
      const row = { range: r.label }
      for (const metro of METROS) {
        row[metro] = listings.filter(l => l.metro === metro && parseFloat(l.price) >= r.min && parseFloat(l.price) < r.max).length
      }
      return row
    })
  }, [listings])

  const formatPeriod = (p) => {
    const [y, m] = p.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(m) - 1]} '${y.slice(2)}`
  }

  const tooltipFmt = (value) => fmt(value)
  const domTooltipFmt = (value) => `${value} days`

  if (loading) return <Layout><div className="spinner"></div></Layout>
  const overall = analytics?.overall || {}
  const metros = analytics?.analytics || {}

  return (
    <Layout>
      <div className="home-analysis">
        <div className="page-header">
          <h1>Market Analysis</h1>
          <p className="page-subtitle">Tampa, Orlando &amp; Jacksonville — Historical Trends &amp; Current Listings</p>
        </div>

        {/* Summary Stats */}
        <div className="analytics-grid">
          <div className="analytics-card"><div className="analytics-label">Total Listings</div><div className="analytics-value">{overall.totalListings || 0}</div></div>
          <div className="analytics-card"><div className="analytics-label">Avg Price</div><div className="analytics-value">{fmt(overall.avgPrice)}</div></div>
          <div className="analytics-card"><div className="analytics-label">Avg $/sqft</div><div className="analytics-value">{fmt(overall.avgPricePerSqft)}</div></div>
          <div className="analytics-card"><div className="analytics-label">Avg DOM</div><div className="analytics-value">{Math.round(overall.avgDOM || 0)}</div></div>
        </div>

        {/* Metro Comparison — 6 cards (SFR + Multi per metro) */}
        {Object.keys(metros).length > 0 && (
          <div className="metro-comparison">
            <h2>Metro Comparison</h2>
            <div className="comparison-grid-6">
              {METROS.map(metro => {
                const d = metros[metro]; if (!d) return null
                const sfr = d.sfr || {}
                const multi = d.multi || {}
                return (
                  <div key={metro} className="comparison-pair">
                    <div className="comparison-card">
                      <div className="comparison-card-header">
                        <h4>{metro}</h4>
                        <span className="card-tag tag-sfr">Single Family</span>
                      </div>
                      <table className="comparison-table"><tbody>
                        <tr><td>Listings</td><td><strong>{sfr.count || 0}</strong></td></tr>
                        <tr><td>Avg Price</td><td><strong>{fmt(sfr.avgPrice)}</strong></td></tr>
                        <tr><td>Avg $/sqft</td><td><strong>{fmt(sfr.avgPricePerSqft)}</strong></td></tr>
                        <tr><td>Avg DOM</td><td><strong>{Math.round(sfr.avgDOM || 0)} days</strong></td></tr>
                        <tr><td>Avg Score</td><td><strong>{(sfr.avgDealScore || 0).toFixed(1)}</strong></td></tr>
                        <tr><td>3BR / 4BR</td><td><strong>{sfr.beds3Count || 0} / {sfr.beds4Count || 0}</strong></td></tr>
                      </tbody></table>
                    </div>
                    <div className="comparison-card">
                      <div className="comparison-card-header">
                        <h4>{metro}</h4>
                        <span className="card-tag tag-multi">Multifamily</span>
                      </div>
                      <table className="comparison-table"><tbody>
                        <tr><td>Listings</td><td><strong>{multi.count || 0}</strong></td></tr>
                        <tr><td>Avg Price</td><td><strong>{fmt(multi.avgPrice)}</strong></td></tr>
                        <tr><td>Avg $/sqft</td><td><strong>{fmt(multi.avgPricePerSqft)}</strong></td></tr>
                        <tr><td>Avg DOM</td><td><strong>{Math.round(multi.avgDOM || 0)} days</strong></td></tr>
                        <tr><td>Avg Score</td><td><strong>{(multi.avgDealScore || 0).toFixed(1)}</strong></td></tr>
                      </tbody></table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Charts Section */}
        {priceChartData.length > 0 && (
          <div className="charts-section">
            <div className="charts-header">
              <h2>Historical Trends</h2>
              <div className="chart-type-toggle">
                <button className={chartType === 'single_family' ? 'active' : ''} onClick={() => setChartType('single_family')}>Single Family</button>
                <button className={chartType === 'multi_family' ? 'active' : ''} onClick={() => setChartType('multi_family')}>Multifamily</button>
              </div>
            </div>
            <p className="charts-subtitle">Source: Redfin market data — Jan 2024 to present</p>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Median List Price</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="period" tickFormatter={formatPeriod} fontSize={11} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} fontSize={11} />
                    <Tooltip formatter={tooltipFmt} labelFormatter={formatPeriod} />
                    <Legend />
                    {METROS.map(m => <Line key={m} type="monotone" dataKey={m} stroke={METRO_COLORS[m]} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Median $/sqft</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ppsqftChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="period" tickFormatter={formatPeriod} fontSize={11} />
                    <YAxis tickFormatter={(v) => `$${v}`} fontSize={11} />
                    <Tooltip formatter={tooltipFmt} labelFormatter={formatPeriod} />
                    <Legend />
                    {METROS.map(m => <Line key={m} type="monotone" dataKey={m} stroke={METRO_COLORS[m]} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Median Days on Market</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={domChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="period" tickFormatter={formatPeriod} fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={domTooltipFmt} labelFormatter={formatPeriod} />
                    <Legend />
                    {METROS.map(m => <Line key={m} type="monotone" dataKey={m} stroke={METRO_COLORS[m]} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Current Price Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="range" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    {METROS.map(m => <Bar key={m} dataKey={m} fill={METRO_COLORS[m]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Filters + Listings Table */}
        <div className="filter-section">
          <select value={filterMetro} onChange={e => setFilterMetro(e.target.value)}>
            <option value="">All Metros</option><option value="Tampa">Tampa</option><option value="Orlando">Orlando</option><option value="Jacksonville">Jacksonville</option>
          </select>
          <select value={filterBeds} onChange={e => setFilterBeds(e.target.value)}>
            <option value="">All Beds</option><option value="3">3 BR</option><option value="4">4 BR</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option><option value="single_family">Single Family</option><option value="multi_family">Multifamily</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {Object.entries(sortOpts).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="filter-count">Showing {listings.length} listings</span>
        </div>

        <div className="listings-table-container">
          <table className="listings-table">
            <thead><tr>
              <th>#</th><th>Property</th><th>Metro</th><th>Type</th><th>Beds/Baths</th><th>Sqft</th>
              <th>Price</th><th>$/sqft</th><th>Year</th><th>DOM</th><th>Est. Rent</th><th>Yield</th><th>Score</th><th>Link</th><th></th>
            </tr></thead>
            <tbody>
              {listings.map((l, i) => {
                const s = sc(l.dealScore)
                return (
                  <tr key={l.id} onClick={() => window.open(`/homes/${l.id}`, '_blank')} style={{ cursor: 'pointer' }}>
                    <td>{i + 1}</td>
                    <td><div className="listing-address">{l.address}</div><div className="listing-city">{l.city}, {l.state} {l.zipCode}</div></td>
                    <td>{l.metro}</td>
                    <td>{l.propertyType === 'multi_family' ? 'Multi' : 'SFR'}</td>
                    <td>{l.beds}/{l.baths}</td>
                    <td>{parseInt(l.sqft || 0).toLocaleString()}</td>
                    <td className="price-cell">{fmt(l.price)}</td>
                    <td>{fmt(l.pricePerSqft)}</td>
                    <td>{l.yearBuilt || '-'}</td>
                    <td>{l.daysOnMarket || '-'}</td>
                    <td>{fmt(l.estimatedRent)}/mo</td>
                    <td>{l.rentalYield ? `${parseFloat(l.rentalYield).toFixed(1)}%` : '-'}</td>
                    <td>{l.dealScore ? <span className="score-badge" style={{ backgroundColor: s.bg, color: s.color }}>{parseFloat(l.dealScore).toFixed(1)}</span> : '-'}</td>
                    <td>{l.sourceUrl && <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link" onClick={e => e.stopPropagation()}>View</a>}</td>
                    <td>
                      <button className="save-btn" onClick={e => toggleSave(e, l.id)} title={savedIds.has(l.id) ? 'Unsave' : 'Save'}>{savedIds.has(l.id) ? '★' : '☆'}</button>
                      <button className="exclude-btn" onClick={e => toggleExclude(e, l.id)} title={excludedIds.has(l.id) ? 'Unexclude' : 'Exclude'}>{excludedIds.has(l.id) ? '✕' : '⊘'}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default HomeAnalysis
