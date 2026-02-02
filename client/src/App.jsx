import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import HomeDashboard from './pages/HomeDashboard'
import HomeAnalysis from './pages/HomeAnalysis'
import HomeMapView from './pages/HomeMapView'
import HomeDetail from './pages/HomeDetail'
import SavedProperties from './pages/SavedProperties'
import ExcludedProperties from './pages/ExcludedProperties'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<PrivateRoute><HomeDashboard /></PrivateRoute>} />
          <Route path="/analysis" element={<PrivateRoute><HomeAnalysis /></PrivateRoute>} />
          <Route path="/map" element={<PrivateRoute><HomeMapView /></PrivateRoute>} />
          <Route path="/homes/:id" element={<PrivateRoute><HomeDetail /></PrivateRoute>} />
          <Route path="/saved" element={<PrivateRoute><SavedProperties /></PrivateRoute>} />
          <Route path="/excluded" element={<PrivateRoute><ExcludedProperties /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
