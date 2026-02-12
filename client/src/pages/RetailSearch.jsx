import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { retailService } from '../services/api'
import './RetailSearch.css'

const RetailSearch = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [listings, setListings] = useState([])
  const [currentCriteria, setCurrentCriteria] = useState(null)
  const [savedSearches, setSavedSearches] = useState([])
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveNotifyEmail, setSaveNotifyEmail] = useState(true)
  const [saveNotifySms, setSaveNotifySms] = useState(false)
  const [listingCount, setListingCount] = useState(0)
  const chatEndRef = useRef(null)

  useEffect(() => {
    loadSavedSearches()
    checkListingCount()
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: "Welcome to Retail Search! I can help you find retail properties across Florida.\n\nTry searching for:\n\n• \"Find restaurants with grease traps in Miami under $2M\"\n• \"Show me strip malls in Tampa\"\n• \"Drive-thru properties in Fort Lauderdale\"\n• \"NNN retail properties in Orlando\""
    }])
  }, [])

  const checkListingCount = async () => {
    try {
      const res = await retailService.getListings({ limit: 1 })
      setListingCount(res.data.count || 0)
    } catch (e) {
      console.error('Failed to check listing count:', e)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Fetching retail listings from LoopNet... This may take a minute.'
    }])

    try {
      const res = await retailService.refreshListings('FL')
      const { stats } = res.data

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Done! Loaded ${stats.total} retail listings (${stats.created} new, ${stats.updated} updated). You can now search for properties!`
      }])

      setListingCount(stats.total)
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error refreshing listings. Please try again.'
      }])
      console.error('Refresh error:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSavedSearches = async () => {
    try {
      const res = await retailService.getSavedSearches()
      setSavedSearches(res.data.searches || [])
    } catch (e) {
      console.error('Failed to load saved searches:', e)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await retailService.chat(userMessage)
      const { message, listings: results, criteria } = res.data

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: message,
        criteria: criteria,
        hasResults: results.length > 0
      }])

      setListings(results)
      setCurrentCriteria({ query: userMessage, parsedCriteria: criteria })
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your search. Please try again.'
      }])
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveSearch = async () => {
    if (!saveName.trim() || !currentCriteria) return

    try {
      await retailService.saveSearch({
        name: saveName,
        query: currentCriteria.query,
        parsedCriteria: currentCriteria.parsedCriteria,
        notifyEmail: saveNotifyEmail,
        notifySms: saveNotifySms
      })

      setShowSaveModal(false)
      setSaveName('')
      loadSavedSearches()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Search saved as "${saveName}"! ${saveNotifyEmail || saveNotifySms ? "You'll receive notifications when new matching properties are found." : ''}`
      }])
    } catch (error) {
      console.error('Failed to save search:', error)
    }
  }

  const handleRunSavedSearch = async (search) => {
    setShowSavedSearches(false)
    setLoading(true)

    setMessages(prev => [...prev, {
      role: 'user',
      content: `Running saved search: ${search.name}`
    }])

    try {
      const res = await retailService.runSearch(search.id)
      const { listings: results, totalMatches, newMatches } = res.data

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Found ${totalMatches} properties matching "${search.name}"${newMatches > 0 ? ` (${newMatches} new since last time)` : ''}.`,
        hasResults: results.length > 0
      }])

      setListings(results)
      setCurrentCriteria({ query: search.query, parsedCriteria: search.parsedCriteria })
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error running your saved search.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSavedSearch = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this saved search?')) return

    try {
      await retailService.deleteSearch(id)
      loadSavedSearches()
    } catch (error) {
      console.error('Failed to delete search:', error)
    }
  }

  const fmt = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return '$0'
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
  }

  return (
    <Layout>
      <div className="retail-search-page">
        <div className="page-header">
          <div>
            <h1>Retail Search</h1>
            <p className="page-subtitle">AI-powered commercial retail property search ({listingCount} listings in database)</p>
          </div>
          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              className="saved-searches-btn"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
            >
              Saved Searches ({savedSearches.length})
            </button>
          </div>
        </div>

        {showSavedSearches && savedSearches.length > 0 && (
          <div className="saved-searches-dropdown">
            {savedSearches.map(search => (
              <div key={search.id} className="saved-search-item" onClick={() => handleRunSavedSearch(search)}>
                <div className="saved-search-info">
                  <span className="saved-search-name">{search.name}</span>
                  <span className="saved-search-query">{search.query}</span>
                </div>
                <div className="saved-search-actions">
                  {search.notifyEmail && <span className="notify-badge">Email</span>}
                  {search.notifySms && <span className="notify-badge">SMS</span>}
                  <button className="delete-btn" onClick={(e) => handleDeleteSavedSearch(search.id, e)}>x</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                  {msg.hasResults && msg.role === 'assistant' && (
                    <button className="save-search-btn" onClick={() => setShowSaveModal(true)}>
                      Save This Search
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your search... (e.g., 'restaurants with grease traps in Miami')"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="send-btn" onClick={handleSend} disabled={loading || !inputValue.trim()}>
              Send
            </button>
          </div>
        </div>

        {listings.length > 0 && (
          <div className="results-section">
            <h2>Results ({listings.length} properties)</h2>
            <div className="listings-grid">
              {listings.map(listing => (
                <div key={listing.id} className="listing-card" onClick={() => window.open(listing.sourceUrl || '#', '_blank')}>
                  {listing.photoUrl && (
                    <div className="listing-photo">
                      <img src={listing.photoUrl} alt={listing.address} />
                    </div>
                  )}
                  <div className="listing-content">
                    <div className="listing-address">{listing.address}</div>
                    <div className="listing-location">{listing.city}, {listing.state} {listing.zipCode}</div>
                    <div className="listing-price">{fmt(listing.price)}</div>
                    <div className="listing-details">
                      {listing.sqft > 0 && <span>{listing.sqft.toLocaleString()} sqft</span>}
                      {listing.pricePerSqft > 0 && <span>{fmt(listing.pricePerSqft)}/sqft</span>}
                      {listing.capRate > 0 && <span>{parseFloat(listing.capRate).toFixed(1)}% Cap</span>}
                    </div>
                    <div className="listing-keywords">
                      {listing.keywords?.slice(0, 4).map((kw, i) => (
                        <span key={i} className="keyword-badge">{kw.toUpperCase()}</span>
                      ))}
                    </div>
                    {listing.daysOnMarket > 0 && (
                      <div className="listing-dom">{listing.daysOnMarket} days on market</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSaveModal && (
          <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Save Search</h3>
              <div className="modal-body">
                <label>
                  Search Name
                  <input
                    type="text"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="e.g., Miami Restaurants"
                  />
                </label>
                <div className="notification-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={saveNotifyEmail}
                      onChange={e => setSaveNotifyEmail(e.target.checked)}
                    />
                    Email notifications for new matches
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={saveNotifySms}
                      onChange={e => setSaveNotifySms(e.target.checked)}
                    />
                    SMS notifications for new matches
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowSaveModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveSearch} disabled={!saveName.trim()}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default RetailSearch
