import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { homeService } from '../services/api'
import './HomeDashboard.css'

const HomeDashboard = () => {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [topDeals, setTopDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState(null)
  const [filterMetro, setFilterMetro] = useState('')
  const [filterBeds, setFilterBeds] = useState('')
  const [savedIds, setSavedIds] = useState(new Set())
  const [excludedIds, setExcludedIds] = useState(new Set())

  useEffect(() => { loadData(); loadSavedIds(); loadExcludedIds() }, [])

  const loadData = async () => {
    try {
      const [analyticsRes, dealsRes, statusRes] = await Promise.all([
        homeService.getHomeAnalytics(),
        homeService.getTopDeals({ limit: 25 }),
        homeService.getRefreshStatus()
      ])
      setAnalytics(analyticsRes.data)
      setTopDeals(dealsRes.data.listings || [])
      setRefreshStatus(statusRes.data)
    } catch (error) {
      console.error('Failed to load home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (refreshStatus && !refreshStatus.canRefresh) return
    setRefreshing(true)
    try {
      await homeService.refreshListings()
      await homeService.scoreListings()
      await loadData()
    } catch (error) {
      if (error.response?.status === 429) {
        setRefreshStatus(prev => ({ ...prev, canRefresh: false, daysUntilRefresh: error.response.data.daysUntilRefresh }))
      }
      console.error('Refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const loadSavedIds = async () => {
    try {
      const res = await homeService.getMySavedIds()
      setSavedIds(new Set(res.data.ids))
    } catch (e) { console.error(e) }
  }

  const loadExcludedIds = async () => {
    try {
      const res = await homeService.getMyExcludedIds()
      setExcludedIds(new Set(res.data.ids))
    } catch (e) { console.error(e) }
  }

  const toggleExclude = async (e, listingId) => {
    e.stopPropagation()
    try {
      if (excludedIds.has(listingId)) {
        await homeService.unexcludeProperty(listingId)
        setExcludedIds(prev => { const n = new Set(prev); n.delete(listingId); return n })
      } else {
        await homeService.excludeProperty(listingId)
        setExcludedIds(prev => new Set(prev).add(listingId))
      }
    } catch (err) { console.error(err) }
  }

  const toggleSave = async (e, listingId) => {
    e.stopPropagation()
    try {
      if (savedIds.has(listingId)) {
        await homeService.unsaveProperty(listingId)
        setSavedIds(prev => { const n = new Set(prev); n.delete(listingId); return n })
      } else {
        await homeService.saveProperty(listingId)
        setSavedIds(prev => new Set(prev).add(listingId))
      }
    } catch (err) { console.error(err) }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const fmt = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
  }

  const scoreColor = (s) => {
    if (s >= 70) return { bg: '#1b1b1b', color: '#ffffff' }
    if (s >= 50) return { bg: '#e8f4f8', color: '#1c4d5a' }
    return { bg: '#f0f0f0', color: '#5e5e5e' }
  }

  const filtered = topDeals.filter(d => {
    if (filterMetro && d.metro !== filterMetro) return false
    if (filterBeds && d.beds !== parseInt(filterBeds)) return false
    return true
  })

  if (loading) return <Layout><div className="spinner"></div></Layout>

  const metros = analytics?.analytics || {}
  const canRefresh = refreshStatus?.canRefresh ?? true
  const daysLeft = refreshStatus?.daysUntilRefresh || 0

  return (
    <Layout>
      <div className="home-dashboard">
        <div className="page-header">
          <div>
            <h1>Section 8 Market Intelligence</h1>
            <p className="page-subtitle">Current Markets — Tampa, Orlando &amp; Jacksonville (3BR, 4BR, Multifamily)</p>
          </div>
          <div className="refresh-area">
            {refreshStatus?.lastRefresh && (
              <span className="last-updated">
                Last updated: {formatDate(refreshStatus.lastRefresh)}
              </span>
            )}
            <button
              className={`refresh-btn ${!canRefresh ? 'refresh-btn-disabled' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing || !canRefresh}
              title={!canRefresh ? `Next refresh available in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Pull latest listings from Realtor.com'}
            >
              {refreshing ? 'Refreshing...' : !canRefresh ? `Refresh in ${daysLeft}d` : 'Refresh Data'}
            </button>
          </div>
        </div>

        <div className="metro-cards">
          {['Tampa', 'Orlando', 'Jacksonville'].map(metro => {
            const d = metros[metro] || {}
            const sfr = d.sfr || {}
            const multi = d.multi || {}
            return (
              <React.Fragment key={metro}>
                <div className="metro-card" onClick={() => navigate(`/analysis?metro=${metro}&propertyType=single_family`)}>
                  <div className="metro-card-header">
                    <h3>{metro}</h3>
                    <span className="metro-card-tag tag-sfr">Single Family</span>
                  </div>
                  <div className="metro-stats">
                    <div className="metro-stat"><span className="stat-label">Listings</span><span className="stat-value">{sfr.count || 0}</span></div>
                    <div className="metro-stat"><span className="stat-label">Avg Price</span><span className="stat-value">{fmt(sfr.avgPrice)}</span></div>
                    <div className="metro-stat"><span className="stat-label">Avg $/sqft</span><span className="stat-value">{fmt(sfr.avgPricePerSqft)}</span></div>
                    <div className="metro-stat"><span className="stat-label">Avg DOM</span><span className="stat-value">{Math.round(sfr.avgDOM || 0)} days</span></div>
                  </div>
                  <div className="metro-breakdown">
                    <span>3BR: {sfr.beds3Count || 0}</span>
                    <span>4BR: {sfr.beds4Count || 0}</span>
                  </div>
                </div>
                <div className="metro-card" onClick={() => navigate(`/analysis?metro=${metro}&propertyType=multi_family`)}>
                  <div className="metro-card-header">
                    <h3>{metro}</h3>
                    <span className="metro-card-tag tag-multi">Multifamily</span>
                  </div>
                  <div className="metro-stats">
                    <div className="metro-stat"><span className="stat-label">Listings</span><span className="stat-value">{multi.count || 0}</span></div>
                    <div className="metro-stat"><span className="stat-label">Avg Price</span><span className="stat-value">{fmt(multi.avgPrice)}</span></div>
                    <div className="metro-stat"><span className="stat-label">Avg $/sqft</span><span className="stat-value">{fmt(multi.avgPricePerSqft)}</span></div>
                    <div className="metro-stat"><span className="stat-label">Avg DOM</span><span className="stat-value">{Math.round(multi.avgDOM || 0)} days</span></div>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>

        {analytics?.overall && (
          <div className="overall-stats">
            <div className="stat-pill"><span>Total:</span> <strong>{analytics.overall.totalListings}</strong></div>
            <div className="stat-pill"><span>Avg Price:</span> <strong>{fmt(analytics.overall.avgPrice)}</strong></div>
            <div className="stat-pill"><span>Avg $/sqft:</span> <strong>{fmt(analytics.overall.avgPricePerSqft)}</strong></div>
            <div className="stat-pill"><span>Avg DOM:</span> <strong>{Math.round(analytics.overall.avgDOM || 0)} days</strong></div>
          </div>
        )}

        <div className="deals-header">
          <h2>Top Deals</h2>
          <div className="deals-filters">
            <select value={filterMetro} onChange={e => setFilterMetro(e.target.value)}>
              <option value="">All Metros</option>
              <option value="Tampa">Tampa</option>
              <option value="Orlando">Orlando</option>
              <option value="Jacksonville">Jacksonville</option>
            </select>
            <select value={filterBeds} onChange={e => setFilterBeds(e.target.value)}>
              <option value="">All Beds</option>
              <option value="3">3 BR</option>
              <option value="4">4 BR</option>
            </select>
          </div>
        </div>

        <div className="deals-table-container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No Listings Yet</h3>
              <p>Click "Refresh Data" to pull listings from the API. Make sure RAPIDAPI_KEY is set in your server .env file.</p>
            </div>
          ) : (
            <table className="deals-table">
              <thead>
                <tr>
                  <th>Rank</th><th>Address</th><th>Metro</th><th>Type</th><th>Beds/Baths</th>
                  <th>Price</th><th>$/sqft</th><th>DOM</th><th>Score</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const sc = scoreColor(d.dealScore)
                  return (
                    <tr key={d.id} onClick={() => window.open(`/homes/${d.id}`, '_blank')} style={{ cursor: 'pointer' }}>
                      <td className="rank">#{i + 1}</td>
                      <td><div className="deal-address">{d.address}</div><div className="deal-city">{d.city}, {d.state}</div></td>
                      <td>{d.metro}</td>
                      <td>{d.propertyType === 'multi_family' ? 'Multi' : 'SFR'}</td>
                      <td>{d.beds}/{d.baths}</td>
                      <td className="price">{fmt(d.price)}</td>
                      <td>{fmt(d.pricePerSqft)}</td>
                      <td>{d.daysOnMarket || '-'}</td>
                      <td><span className="score-badge" style={{ backgroundColor: sc.bg, color: sc.color }}>{parseFloat(d.dealScore).toFixed(1)}</span></td>
                      <td>
                        <button className="save-btn" onClick={e => toggleSave(e, d.id)} title={savedIds.has(d.id) ? 'Unsave' : 'Save'}>{savedIds.has(d.id) ? '★' : '☆'}</button>
                        <button className="exclude-btn" onClick={e => toggleExclude(e, d.id)} title={excludedIds.has(d.id) ? 'Unexclude' : 'Exclude'}>{excludedIds.has(d.id) ? '✕' : '⊘'}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default HomeDashboard
