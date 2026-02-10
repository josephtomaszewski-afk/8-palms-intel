import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { homeService } from '../services/api'
import './ValueAddMultifamily.css'

const ValueAddMultifamily = () => {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterMetro, setFilterMetro] = useState('')
  const [sortBy, setSortBy] = useState('price_asc')
  const [savedIds, setSavedIds] = useState(new Set())
  const [excludedIds, setExcludedIds] = useState(new Set())

  useEffect(() => { loadData(); loadSavedIds(); loadExcludedIds() }, [filterMetro, sortBy])

  const loadData = async () => {
    try {
      const params = { sort: sortBy }
      if (filterMetro) params.metro = filterMetro
      const res = await homeService.getValueAddListings(params)
      setListings(res.data.listings || [])
    } catch (error) {
      console.error('Failed to load value add listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await homeService.refreshValueAddListings()
      await loadData()
    } catch (error) {
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

  const fmt = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
  }

  const metros = ['Tampa', 'Orlando', 'Jacksonville', 'Miami', 'Palm Beach', 'SW Florida', 'Sarasota', 'Other FL']

  if (loading) return <Layout><div className="spinner"></div></Layout>

  return (
    <Layout>
      <div className="value-add-page">
        <div className="page-header">
          <div>
            <h1>Value Add Multifamily</h1>
            <p className="page-subtitle">Florida Statewide — $3M - $6M Multifamily Properties (MLS + LoopNet)</p>
          </div>
          <div className="refresh-area">
            <span className="listing-count">{listings.length} listings</span>
            <button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        <div className="filters-bar">
          <select value={filterMetro} onChange={e => setFilterMetro(e.target.value)}>
            <option value="">All Florida</option>
            {metros.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="dom_desc">Longest on Market</option>
          </select>
        </div>

        <div className="listings-grid">
          {listings.length === 0 ? (
            <div className="empty-state">
              <h3>No Value Add Listings Yet</h3>
              <p>Click "Refresh Data" to pull statewide Florida multifamily listings ($3M-$6M) from the API.</p>
            </div>
          ) : (
            listings.map(listing => (
              <div
                key={listing.id}
                className="listing-card"
                onClick={() => window.open(`/homes/${listing.id}`, '_blank')}
              >
                {listing.photoUrl && (
                  <div className="listing-photo">
                    <img src={listing.photoUrl} alt={listing.address} />
                  </div>
                )}
                <div className="listing-content">
                  <div className="listing-header">
                    <div className="listing-address">{listing.address}</div>
                    <div className="listing-location">{listing.city}, {listing.state} {listing.zipCode}</div>
                  </div>
                  <div className="listing-price">{fmt(listing.price)}</div>
                  <div className="listing-details">
                    {listing.units > 0 && <span>{listing.units} units</span>}
                    {!listing.units && listing.beds > 0 && <span>{listing.beds} beds</span>}
                    {listing.baths > 0 && <span>{listing.baths} baths</span>}
                    {listing.sqft > 0 && <span>{listing.sqft.toLocaleString()} sqft</span>}
                  </div>
                  <div className="listing-meta">
                    <span className="metro-tag">{listing.metro}</span>
                    {listing.source === 'loopnet' && <span className="source-badge loopnet">LOOPNET</span>}
                    {listing.isValueAdd && <span className="value-add-badge">VALUE ADD</span>}
                    {listing.capRate > 0 && <span className="cap-rate">{parseFloat(listing.capRate).toFixed(1)}% Cap</span>}
                    {listing.daysOnMarket > 0 && <span className="dom">{listing.daysOnMarket} DOM</span>}
                  </div>
                  {listing.pricePerSqft && (
                    <div className="price-per-sqft">{fmt(listing.pricePerSqft)}/sqft</div>
                  )}
                </div>
                <div className="listing-actions">
                  <button
                    className="save-btn"
                    onClick={e => toggleSave(e, listing.id)}
                    title={savedIds.has(listing.id) ? 'Unsave' : 'Save'}
                  >
                    {savedIds.has(listing.id) ? '★' : '☆'}
                  </button>
                  <button
                    className="exclude-btn"
                    onClick={e => toggleExclude(e, listing.id)}
                    title={excludedIds.has(listing.id) ? 'Unexclude' : 'Exclude'}
                  >
                    {excludedIds.has(listing.id) ? '✕' : '⊘'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ValueAddMultifamily
