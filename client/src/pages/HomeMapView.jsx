import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl'
import Layout from '../components/Layout'
import { homeService } from '../services/api'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

const HomeMapView = () => {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filterMetro, setFilterMetro] = useState('')
  const [filterBeds, setFilterBeds] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterScore, setFilterScore] = useState('all')
  const [viewState, setViewState] = useState({ latitude: 28.5, longitude: -81.8, zoom: 7 })

  useEffect(() => { loadData() }, [filterMetro, filterBeds, filterType])

  const loadData = async () => {
    try {
      const params = {}
      if (filterMetro) params.metro = filterMetro
      if (filterBeds) params.beds = filterBeds
      if (filterType) params.propertyType = filterType
      const res = await homeService.getHomeListingsForMap(params)
      setListings(res.data.listings || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const markerColor = (s) => { const v = parseFloat(s); if (!v) return '#999'; if (v >= 70) return '#1b1b1b'; if (v >= 50) return '#477d8f'; return '#b9b9b9' }
  const fmt = (v) => { const n = parseFloat(v); if (isNaN(n)) return '$0'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }

  const filtered = listings.filter(l => {
    const s = parseFloat(l.dealScore) || 0
    if (filterScore === 'excellent' && s < 70) return false
    if (filterScore === 'good' && (s < 50 || s >= 70)) return false
    if (filterScore === 'fair' && s >= 50) return false
    return true
  })

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>
        <div style={{ display: 'flex', gap: 10, padding: '10px 15px', background: 'white', borderBottom: '1px solid #e0e0e0', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            [filterMetro, setFilterMetro, [['', 'All Metros'], ['Tampa', 'Tampa'], ['Orlando', 'Orlando'], ['Jacksonville', 'Jacksonville']]],
            [filterBeds, setFilterBeds, [['', 'All Beds'], ['3', '3 BR'], ['4', '4 BR']]],
            [filterType, setFilterType, [['', 'All Types'], ['single_family', 'Single Family'], ['multi_family', 'Multifamily']]],
            [filterScore, setFilterScore, [['all', 'All Scores'], ['excellent', 'Excellent (70+)'], ['good', 'Good (50-69)'], ['fair', 'Fair (<50)']]]
          ].map(([val, setter, opts], i) => (
            <select key={i} value={val} onChange={e => setter(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4 }}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#95a5a6' }}>{filtered.length} on map</span>
        </div>
        <div style={{ flex: 1 }}>
          {!MAPBOX_TOKEN ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}><h3>Set VITE_MAPBOX_TOKEN in .env</h3></div>
          ) : (
            <Map ref={mapRef} {...viewState} onMove={e => setViewState(e.viewState)} mapboxAccessToken={MAPBOX_TOKEN} style={{ width: '100%', height: '100%' }} mapStyle="mapbox://styles/mapbox/light-v11">
              <NavigationControl position="top-right" /><GeolocateControl position="top-right" />
              {filtered.map(l => (
                <Marker key={l.id} latitude={parseFloat(l.latitude)} longitude={parseFloat(l.longitude)} anchor="bottom"
                  onClick={e => { e.originalEvent.stopPropagation(); setSelected(l) }}>
                  <div style={{ width: selected?.id === l.id ? 18 : 14, height: selected?.id === l.id ? 18 : 14, backgroundColor: markerColor(l.dealScore), borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', cursor: 'pointer' }} />
                </Marker>
              ))}
              {selected && (
                <Popup latitude={parseFloat(selected.latitude)} longitude={parseFloat(selected.longitude)} anchor="bottom" offset={20} onClose={() => setSelected(null)} closeButton closeOnClick={false}>
                  <div style={{ maxWidth: 260, padding: 5 }}>
                    {selected.photoUrl && <img src={selected.photoUrl} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />}
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{selected.address}</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{selected.city} | {selected.metro}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: '#477d8f' }}>{fmt(selected.price)}</span>
                      <span>{selected.beds}bd/{selected.baths}ba | {parseInt(selected.sqft || 0).toLocaleString()} sqft</span>
                    </div>
                    {selected.dealScore && <div style={{ marginBottom: 8 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 3, fontWeight: 700, fontSize: 13, backgroundColor: parseFloat(selected.dealScore) >= 70 ? '#1b1b1b' : parseFloat(selected.dealScore) >= 50 ? '#e8f4f8' : '#f0f0f0', color: parseFloat(selected.dealScore) >= 70 ? '#ffffff' : parseFloat(selected.dealScore) >= 50 ? '#1c4d5a' : '#5e5e5e' }}>Score: {parseFloat(selected.dealScore).toFixed(1)}</span>
                    </div>}
                    <button onClick={() => window.open(`/homes/${selected.id}`, '_blank')} style={{ width: '100%', padding: '6px 0', background: '#000000', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>View Details</button>
                  </div>
                </Popup>
              )}
            </Map>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default HomeMapView
