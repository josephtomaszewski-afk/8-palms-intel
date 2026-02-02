import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#ffffff'
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 48, width: 420,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo.png" alt="8 Palms" style={{ height: 50, marginBottom: 16 }} />
          <p style={{ margin: 0, color: '#777', fontSize: 14, letterSpacing: '0.5px' }}>Section 8 Market Intelligence</p>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da', color: '#721c24', padding: '10px 15px',
            borderRadius: 6, marginBottom: 20, fontSize: 14
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#1b1b1b' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="you@8-palms.com"
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid #b9b9b9', borderRadius: 6,
                fontSize: 14, boxSizing: 'border-box', color: '#1b1b1b'
              }}
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#1b1b1b' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="Enter password"
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid #b9b9b9', borderRadius: 6,
                fontSize: 14, boxSizing: 'border-box', color: '#1b1b1b'
              }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '13px', background: '#000000', color: '#ffffff',
              border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.7 : 1, letterSpacing: '0.5px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, padding: '12px 16px', borderTop: '1px solid #e0e0e0' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#c0392b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Authorized Users Only
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#c0392b', lineHeight: 1.5 }}>
            Property of 8 Palms Private Equity Group LLC. Unauthorized access, use, or distribution is strictly prohibited and may be subject to civil and criminal penalties.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
