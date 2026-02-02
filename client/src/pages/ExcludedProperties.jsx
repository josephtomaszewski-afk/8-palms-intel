import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { homeService } from '../services/api'
import './ExcludedProperties.css'

const ExcludedProperties = () => {
  const [excluded, setExcluded] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadExcluded() }, [])

  const loadExcluded = async () => {
    try {
      const res = await homeService.getExcludedProperties()
      setExcluded(res.data.excluded || [])
    } catch (error) {
      console.error('Failed to load excluded:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnexclude = async (homeListingId) => {
    try {
      await homeService.unexcludeProperty(homeListingId)
      setExcluded(prev => prev.filter(e => e.homeListingId !== homeListingId))
    } catch (error) {
      console.error('Failed to unexclude:', error)
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
      <div className="excluded-properties">
        <div className="page-header">
          <h1>Excluded Properties</h1>
          <p className="page-subtitle">{excluded.length} properties excluded by the team</p>
        </div>

        {excluded.length === 0 ? (
          <div className="empty-state">
            <h3>No Excluded Properties</h3>
            <p>Exclude properties from the Dashboard, Analysis, or Detail pages using the exclude button.</p>
          </div>
        ) : (
          <div className="excluded-table-container">
            <table className="excluded-table">
              <thead><tr>
                <th>Excluded By</th><th>Property</th><th>Metro</th><th>Type</th><th>Beds/Baths</th>
                <th>Price</th><th>$/sqft</th><th>DOM</th><th>Score</th><th>Date Excluded</th><th></th>
              </tr></thead>
              <tbody>
                {excluded.map(e => {
                  const l = e.HomeListing || {}
                  const scoreStyle = sc(l.dealScore)
                  return (
                    <tr key={e.id} onClick={() => window.open(`/homes/${l.id}`, '_blank')} style={{ cursor: 'pointer' }}>
                      <td><span className="excluded-by-badge">{e.excludedBy}</span></td>
                      <td><div className="excluded-address">{l.address}</div><div className="excluded-city">{l.city}, {l.state} {l.zipCode}</div></td>
                      <td>{l.metro}</td>
                      <td>{l.propertyType === 'multi_family' ? 'Multi' : 'SFR'}</td>
                      <td>{l.beds}/{l.baths}</td>
                      <td className="price-cell">{fmt(l.price)}</td>
                      <td>{fmt(l.pricePerSqft)}</td>
                      <td>{l.daysOnMarket || '-'}</td>
                      <td>{l.dealScore ? <span className="score-badge" style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.color }}>{parseFloat(l.dealScore).toFixed(1)}</span> : '-'}</td>
                      <td className="date-cell">{new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td><button className="unexclude-btn" onClick={ev => { ev.stopPropagation(); handleUnexclude(e.homeListingId) }} title="Remove from excluded">&times;</button></td>
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

export default ExcludedProperties
