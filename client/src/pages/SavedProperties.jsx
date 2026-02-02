import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { homeService } from '../services/api'
import './SavedProperties.css'

const SavedProperties = () => {
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSaved() }, [])

  const loadSaved = async () => {
    try {
      const res = await homeService.getSavedProperties()
      setSaved(res.data.saved || [])
    } catch (error) {
      console.error('Failed to load saved:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (homeListingId) => {
    try {
      await homeService.unsaveProperty(homeListingId)
      setSaved(prev => prev.filter(s => s.homeListingId !== homeListingId))
    } catch (error) {
      console.error('Failed to unsave:', error)
    }
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

  if (loading) return <Layout><div className="spinner"></div></Layout>

  return (
    <Layout>
      <div className="saved-properties">
        <div className="page-header">
          <h1>Saved Properties</h1>
          <p className="page-subtitle">{saved.length} properties saved by the team</p>
        </div>

        {saved.length === 0 ? (
          <div className="empty-state">
            <h3>No Saved Properties</h3>
            <p>Save properties from the Dashboard, Analysis, or Detail pages using the bookmark icon.</p>
          </div>
        ) : (
          <div className="saved-table-container">
            <table className="saved-table">
              <thead><tr>
                <th>Saved By</th><th>Property</th><th>Metro</th><th>Type</th><th>Beds/Baths</th>
                <th>Price</th><th>$/sqft</th><th>DOM</th><th>Score</th><th>Date Saved</th><th></th>
              </tr></thead>
              <tbody>
                {saved.map(s => {
                  const l = s.HomeListing || {}
                  const scoreStyle = sc(l.dealScore)
                  return (
                    <tr key={s.id} onClick={() => window.open(`/homes/${l.id}`, '_blank')} style={{ cursor: 'pointer' }}>
                      <td><span className="saved-by-badge">{s.savedBy}</span></td>
                      <td><div className="saved-address">{l.address}</div><div className="saved-city">{l.city}, {l.state} {l.zipCode}</div></td>
                      <td>{l.metro}</td>
                      <td>{l.propertyType === 'multi_family' ? 'Multi' : 'SFR'}</td>
                      <td>{l.beds}/{l.baths}</td>
                      <td className="price-cell">{fmt(l.price)}</td>
                      <td>{fmt(l.pricePerSqft)}</td>
                      <td>{l.daysOnMarket || '-'}</td>
                      <td>{l.dealScore ? <span className="score-badge" style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.color }}>{parseFloat(l.dealScore).toFixed(1)}</span> : '-'}</td>
                      <td className="date-cell">{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td><button className="unsave-btn" onClick={e => { e.stopPropagation(); handleUnsave(s.homeListingId) }} title="Remove">×</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SavedProperties
