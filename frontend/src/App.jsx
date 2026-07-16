import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const initialApplicationForm = {
  application_type: 'NEW_ID',
  full_name: '',
  dob: '',
  gender: '',
  resident_address: '',
  phone_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  blood_group: '',
  existing_id_number: '',
  reason_for_renewal: '',
  child_full_name: '',
  place_of_birth: '',
  father_full_name: '',
  mother_full_name: '',
  photo: null,
  residence_proof: null,
  old_id_card: null,
  hospital_proof: null,
  parent_id: null,
  birth_certificate_photo: null,
}

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function decodeJwtPayload(token) {
  if (!token) return null

  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function apiRequest(path, { method = 'GET', body, isFormData = false, auth = true } = {}) {
  const headers = {}
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  if (auth) {
    Object.assign(headers, getAuthHeaders())
  }

  const options = { method, headers }
  if (body != null) {
    options.body = isFormData ? body : JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || data?.error || 'Request failed')
  }

  return data
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  const loadApplications = async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/api/v1/applications/')
      setApplications(Array.isArray(data) ? data : data?.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUser = async () => {
    if (!token) {
      setIsAdmin(false)
      return
    }

    try {
      const payload = decodeJwtPayload(token)
      const userId = payload?.user_id || payload?.id
      if (!userId) {
        setIsAdmin(false)
        return
      }

      const data = await apiRequest(`/api/v1/auth/users/${userId}/`)
      setIsAdmin(Boolean(data?.is_admin || data?.is_staff || data?.is_superuser))
    } catch {
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadApplications()
      loadCurrentUser()
    } else {
      setIsAdmin(false)
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setIsAdmin(false)
    setApplications([])
    setMessage('You have been signed out.')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Government Service Portal</p>
          <h1>Govenment Service Management</h1>
        </div>
        <nav>
          <Link to="/">Home</Link>
          {token ? (
            <>
              <Link to="/applications">Applications</Link>
              <button className="ghost-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      {message ? <div className="alert success">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <Routes>
        <Route path="/" element={<HomePage token={token} />} />
        <Route path="/login" element={token ? <Navigate to="/applications" replace /> : <LoginPage setToken={setToken} setMessage={setMessage} setError={setError} />} />
        <Route path="/register" element={token ? <Navigate to="/applications" replace /> : <RegisterPage setMessage={setMessage} setError={setError} />} />
        <Route path="/applications" element={token ? <ApplicationsPage applications={applications} loading={loading} loadApplications={loadApplications} setMessage={setMessage} setError={setError} isAdmin={isAdmin} /> : <Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

function HomePage({ token }) {
  return (
    <section className="hero-card">
      <div>
        <p className="eyebrow">Minimal React frontend</p>
        <h2>Manage resident services through the Django API</h2>
        <p>
          This portal connects to the authentication and application endpoints for new ID requests,
          ID renewals, and birth certificate submissions.
        </p>
      </div>
      <div className="info-grid">
        <article>
          <h3>Register</h3>
          <p>Create resident accounts through the auth API.</p>
        </article>
        <article>
          <h3>Login</h3>
          <p>Receive a JWT and access protected application routes.</p>
        </article>
        <article>
          <h3>Submit applications</h3>
          <p>Fill in service-specific forms and track their status.</p>
        </article>
      </div>
      {!token ? (
        <div className="actions">
          <Link to="/register" className="primary-button">Create account</Link>
          <Link to="/login" className="secondary-button">Sign in</Link>
        </div>
      ) : (
        <div className="actions">
          <Link to="/applications" className="primary-button">Go to applications</Link>
        </div>
      )}
    </section>
  )
}

function LoginPage({ setToken, setMessage, setError }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await apiRequest('/api/v1/auth/login/', { method: 'POST', body: form })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setToken(data.access)
      setMessage('Login successful. You can now manage your applications.')
      navigate('/applications')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Username
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </label>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}

function RegisterPage({ setMessage, setError }) {
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', phone_number: '', address: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiRequest('/api/v1/auth/register/', { method: 'POST', body: form })
      setMessage('Account created. Please sign in to continue.')
      setForm({ username: '', email: '', full_name: '', password: '', phone_number: '', address: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h2>Create account</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Username
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label>
          Full name
          <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </label>
        <label>
          Phone number
          <input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} />
        </label>
        <label>
          Address
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </label>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </section>
  )
}

function ApplicationsPage({ applications, loading, loadApplications, setMessage, setError, isAdmin }) {
  const [form, setForm] = useState(initialApplicationForm)
  const [submitting, setSubmitting] = useState(false)

  const handleStatusUpdate = async (applicationId, nextStatus) => {
    try {
      await apiRequest(`/api/v1/applications/${applicationId}/`, {
        method: 'PATCH',
        body: { status: nextStatus },
      })
      setMessage(`Status updated to ${nextStatus}.`)
      loadApplications()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = new FormData()
      payload.append('application_type', form.application_type)

      Object.entries(form).forEach(([key, value]) => {
        if (key === 'application_type' || value == null || value === '') {
          return
        }
        payload.append(key, value)
      })

      await apiRequest('/api/v1/applications/', {
        method: 'POST',
        body: payload,
        isFormData: true,
      })

      setMessage('Application submitted successfully.')
      setForm(initialApplicationForm)
      loadApplications()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const renderSpecificFields = () => {
    switch (form.application_type) {
      case 'NEW_ID':
        return (
          <>
            <label>Full name<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required /></label>
            <label>Date of birth<input type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} required /></label>
            <label>Gender<input value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} required /></label>
            <label>Blood group<input value={form.blood_group} onChange={(event) => setForm({ ...form, blood_group: event.target.value })} /></label>
            <label>Resident address<input value={form.resident_address} onChange={(event) => setForm({ ...form, resident_address: event.target.value })} required /></label>
            <label>Phone number<input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} required /></label>
            <label>Emergency contact name<input value={form.emergency_contact_name} onChange={(event) => setForm({ ...form, emergency_contact_name: event.target.value })} /></label>
            <label>Emergency contact phone<input value={form.emergency_contact_phone} onChange={(event) => setForm({ ...form, emergency_contact_phone: event.target.value })} /></label>
            <label>Photo<input type="file" onChange={(event) => setForm({ ...form, photo: event.target.files?.[0] || null })} required /></label>
            <label>Residence proof (PDF)<input type="file" accept=".pdf" onChange={(event) => setForm({ ...form, residence_proof: event.target.files?.[0] || null })} required /></label>
          </>
        )
      case 'ID_RENEWAL':
        return (
          <>
            <label>Existing ID number<input value={form.existing_id_number} onChange={(event) => setForm({ ...form, existing_id_number: event.target.value })} required /></label>
            <label>Full name<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required /></label>
            <label>Date of birth<input type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} required /></label>
            <label>Resident address<input value={form.resident_address} onChange={(event) => setForm({ ...form, resident_address: event.target.value })} required /></label>
            <label>Phone number<input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} required /></label>
            <label>Reason for renewal<input value={form.reason_for_renewal} onChange={(event) => setForm({ ...form, reason_for_renewal: event.target.value })} /></label>
            <label>Old ID card<input type="file" onChange={(event) => setForm({ ...form, old_id_card: event.target.files?.[0] || null })} required /></label>
            <label>Photo<input type="file" onChange={(event) => setForm({ ...form, photo: event.target.files?.[0] || null })} required /></label>
          </>
        )
      case 'BIRTH_CERTIFICATE':
        return (
          <>
            <label>Child full name<input value={form.child_full_name} onChange={(event) => setForm({ ...form, child_full_name: event.target.value })} required /></label>
            <label>Date of birth<input type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} required /></label>
            <label>Place of birth<input value={form.place_of_birth} onChange={(event) => setForm({ ...form, place_of_birth: event.target.value })} required /></label>
            <label>Gender<input value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} required /></label>
            <label>Father full name<input value={form.father_full_name} onChange={(event) => setForm({ ...form, father_full_name: event.target.value })} /></label>
            <label>Mother full name<input value={form.mother_full_name} onChange={(event) => setForm({ ...form, mother_full_name: event.target.value })} /></label>
            <label>Resident address<input value={form.resident_address} onChange={(event) => setForm({ ...form, resident_address: event.target.value })} required /></label>
            <label>Phone number<input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} required /></label>
            <label>Hospital proof<input type="file" onChange={(event) => setForm({ ...form, hospital_proof: event.target.files?.[0] || null })} required /></label>
            <label>Parent ID<input type="file" onChange={(event) => setForm({ ...form, parent_id: event.target.files?.[0] || null })} required /></label>
            <label>Birth certificate photo<input type="file" onChange={(event) => setForm({ ...form, birth_certificate_photo: event.target.files?.[0] || null })} required /></label>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="dashboard-grid">
      {!isAdmin ? (
        <section className="panel">
          <h2>Submit a new application</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Service type
              <select value={form.application_type} onChange={(event) => setForm({ ...form, application_type: event.target.value })}>
                <option value="NEW_ID">New ID</option>
                <option value="ID_RENEWAL">ID Renewal</option>
                <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
              </select>
            </label>
            {renderSpecificFields()}
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2>{isAdmin ? 'Review applications' : 'Your applications'}</h2>
        {loading ? <p>Loading...</p> : null}
        {!loading && applications.length === 0 ? <p>No applications yet.</p> : null}
        <div className="application-list">
          {applications.map((application) => (
            <article key={application.id} className="application-card">
              <div className="application-meta">
                <strong>{application.application_type}</strong>
                <span>{application.status}</span>
              </div>
              <p>{application.full_name || application.child_full_name || 'Resident'}</p>
              <small>Created: {application.created_at?.slice(0, 10) || 'N/A'}</small>
              {isAdmin ? (
                <label className="status-control">
                  Update status
                  <select
                    value={application.status}
                    onChange={(event) => handleStatusUpdate(application.id, event.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="READY">Ready</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
