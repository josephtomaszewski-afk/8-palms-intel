import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { homeService } from '../services/api'

const HomeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [comparables, setComparables] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [isExcluded, setIsExcluded] = useState(false)

  useEffect(() => {
    homeService.getHomeListingById(id)
      .then(res => { setListing(res.data.listing); setComparables(res.data.comparables || []) })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
    homeService.getMySavedIds()
      .then(res => { if (res.data.ids.includes(id)) setIsSaved(true) })
      .catch(() => {})
    homeService.getMyExcludedIds()
      .then(res => { if (res.data.ids.includes(id)) setIsExcluded(true) })
      .catch(() => {})
  }, [id])

  const toggleSave = async () => {
    try {
      if (isSaved) { await homeService.unsaveProperty(id); setIsSaved(false) }
      else { await homeService.saveProperty(id); setIsSaved(true) }
    } catch (err) { console.error(err) }
  }

  const toggleExclude = async () => {
    try {
      if (isExcluded) { await homeService.unexcludeProperty(id); setIsExcluded(false) }
      else { await homeService.excludeProperty(id); setIsExcluded(true) }
    } catch (err) { console.error(err) }
  }

  const fmt = (v) => { const n = parseFloat(v); if (isNaN(n)) return '$0'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }
  const ss = (s) => { const v = parseFloat(s); if (v >= 70) return { backgroundColor: '#1b1b1b', color: '#ffffff' }; if (v >= 50) return { backgroundColor: '#e8f4f8', color: '#1c4d5a' }; return { backgroundColor: '#f0f0f0', color: '#5e5e5e' } }

  if (loading) return <Layout><div className="spinner"></div></Layout>
  if (!listing) return <Layout><div style={{ padding: 40, textAlign: 'center' }}>Listing not found</div></Layout>

  const bd = listing.scoreBreakdown || {}

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 30 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#477d8f', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}>&larr; Back</button>

        <div style={{ display: 'flex', gap: 30, marginBottom: 30, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 400px' }}>
            {listing.photoUrl ? <img src={listing.photoUrl} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 8 }} /> :
              <div style={{ width: '100%', height: 280, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Photo</div>}
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h1 style={{ margin: '0 0 5px', color: '#1b1b1b', fontSize: 24 }}>{listing.address}</h1>
            <p style={{ margin: '0 0 15px', color: '#7f8c8d', fontSize: 16 }}>{listing.city}, {listing.state} {listing.zipCode} | {listing.metro}</p>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#477d8f', marginBottom: 15 }}>{fmt(listing.price)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 15 }}>
              {[['Beds', listing.beds], ['Baths', listing.baths], ['Sqft', parseInt(listing.sqft || 0).toLocaleString()]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 12, color: '#95a5a6', textTransform: 'uppercase' }}>{l}</div><div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div></div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
              {[['$/sqft', fmt(listing.pricePerSqft)], ['Year', listing.yearBuilt || 'N/A'], ['Type', listing.propertyType === 'multi_family' ? 'Multifamily' : 'Single Family']].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 12, color: '#95a5a6', textTransform: 'uppercase' }}>{l}</div><div style={{ fontSize: 16, fontWeight: 600 }}>{v}</div></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 15, alignItems: 'center' }}>
              <a href={listing.sourceUrl || `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(listing.address + ' ' + listing.city + ' ' + listing.state + ' ' + (listing.zipCode || ''))}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 20px', background: '#000000', color: 'white', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>{listing.sourceUrl ? 'View Original Listing' : 'Search on Realtor.com'}</a>
              <button onClick={toggleSave} style={{ padding: '10px 20px', background: isSaved ? '#477d8f' : 'white', color: isSaved ? 'white' : '#477d8f', border: '2px solid #477d8f', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{isSaved ? '★ Saved' : '☆ Save Property'}</button>
              <button onClick={toggleExclude} style={{ padding: '10px 20px', background: isExcluded ? '#c0392b' : 'white', color: isExcluded ? 'white' : '#c0392b', border: '2px solid #c0392b', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{isExcluded ? '✕ Excluded' : '⊘ Exclude'}</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 15px', color: '#1b1b1b' }}>Deal Score</h3>
            {listing.dealScore ? (<>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ display: 'inline-block', padding: '8px 24px', borderRadius: 8, fontSize: 28, fontWeight: 700, ...ss(listing.dealScore) }}>{parseFloat(listing.dealScore).toFixed(1)}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                {[['Price vs Market (30%)', bd.priceVsMarket], ['Days on Market (20%)', bd.daysOnMarket], ['Price Reductions (20%)', bd.priceReductions], ['Rental Yield (20%)', bd.rentalYield], ['Property Age (10%)', bd.propertyAge]].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '8px 0', fontSize: 14, color: '#666' }}>{label}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <div style={{ width: 80, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${val || 0}%`, height: '100%', borderRadius: 4, background: (val || 0) >= 70 ? '#1b1b1b' : (val || 0) >= 50 ? '#477d8f' : '#b9b9b9' }} />
                        </div>
                        <span style={{ fontWeight: 600, width: 35, textAlign: 'right' }}>{(val || 0).toFixed(0)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </>) : <p style={{ color: '#999', textAlign: 'center' }}>Not scored yet</p>}
          </div>

          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 15px', color: '#1b1b1b' }}>Market Data</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
              {[['Days on Market', listing.daysOnMarket || 'N/A'], ['Original Price', fmt(listing.originalPrice)], ['Current Price', fmt(listing.price)], ['Price Reductions', listing.priceReductions || 0], ['Lot Size', listing.lotSize ? `${parseInt(listing.lotSize).toLocaleString()} sqft` : 'N/A'], ['Est. Monthly Rent', fmt(listing.estimatedRent)], ['Annual Yield', listing.rentalYield ? `${parseFloat(listing.rentalYield).toFixed(1)}%` : 'N/A'], ['Neighborhood', listing.neighborhood || 'N/A']].map(([l, v]) => (
                <tr key={l}><td style={{ padding: '8px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #f0f0f0' }}>{l}</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>{v}</td></tr>
              ))}
            </tbody></table>
          </div>
        </div>

        {comparables.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 15px', color: '#1b1b1b' }}>Comparable Sales</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>
              {['Address', 'Sold Price', 'Sold Date', 'Beds/Baths', 'Sqft', '$/sqft', 'Distance'].map(h => <th key={h} style={{ padding: 10, textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: '#666', borderBottom: '2px solid #e0e0e0' }}>{h}</th>)}
            </tr></thead><tbody>
              {comparables.map(c => <tr key={c.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>{c.address}</td>
                <td style={{ padding: 10, fontWeight: 600, color: '#477d8f', borderBottom: '1px solid #f0f0f0' }}>{fmt(c.soldPrice)}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>{c.soldDate ? new Date(c.soldDate).toLocaleDateString() : '-'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>{c.beds}/{c.baths}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>{parseInt(c.sqft || 0).toLocaleString()}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>{fmt(c.pricePerSqft)}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>{c.distance ? `${c.distance} mi` : '-'}</td>
              </tr>)}
            </tbody></table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default HomeDetail
