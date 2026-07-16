import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const serviceNames = {
  NEW_ID: 'New national ID',
  ID_RENEWAL: 'ID renewal',
  BIRTH_CERTIFICATE: 'Birth certificate',
}

function Icon({ name, size = 20 }) {
  const paths = {
    building: <><path d="M3 21h18"/><path d="M6 21V10h12v11"/><path d="M4 10h16L12 3 4 10Z"/><path d="M9 14v3M12 14v3M15 14v3"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

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
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
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

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const data = await apiRequest('/api/v1/auth/users/')
      setUsers(Array.isArray(data) ? data : data?.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setUsersLoading(false)
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
      const adminUser = Boolean(data?.is_admin || data?.is_staff || data?.is_superuser)
      setIsAdmin(adminUser)
      if (adminUser) {
        await loadUsers()
      }
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
      setUsers([])
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setIsAdmin(false)
    setApplications([])
    setUsers([])
    setMessage('You have been signed out.')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Citizen Services home">
          <span className="brand-mark"><Icon name="building" size={25} /></span>
          <span><strong>Citizen Services</strong><small>Government Service Portal</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          {token ? (
            <>
              <NavLink to="/applications">Applications</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <button className="nav-logout" onClick={handleLogout}><Icon name="logout" size={17} /> Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <Link to="/register" className="nav-cta">Create account</Link>
            </>
          )}
        </nav>
      </header>

      <main>
      {message ? <div className="alert success" role="status"><Icon name="check" size={18} />{message}</div> : null}
      {error ? <div className="alert error" role="alert">{error}</div> : null}

      <Routes>
        <Route path="/" element={<HomePage token={token} />} />
        <Route path="/login" element={token ? <Navigate to="/applications" replace /> : <LoginPage setToken={setToken} setMessage={setMessage} setError={setError} />} />
        <Route path="/register" element={token ? <Navigate to="/applications" replace /> : <RegisterPage setMessage={setMessage} setError={setError} />} />
        <Route path="/applications" element={token ? <ApplicationsPage applications={applications} loading={loading} loadApplications={loadApplications} setMessage={setMessage} setError={setError} isAdmin={isAdmin} users={users} usersLoading={usersLoading} /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={token ? <ProfilePage setMessage={setMessage} setError={setError} /> : <Navigate to="/login" replace />} />
      </Routes>
      </main>
      <footer><span>© {new Date().getFullYear()} Citizen Services Portal</span><span>Secure • Accessible • Transparent</span></footer>
    </div>
  )
}

function HomePage({ token }) {
  return (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <div className="trust-label"><Icon name="shield" size={16} /> Official digital service portal</div>
          <h1>Essential government services, <span>made simpler.</span></h1>
          <p>Apply for resident documents, upload supporting records, and follow every update from one secure place.</p>
          {!token ? (
            <div className="actions">
              <Link to="/register" className="primary-button">Get started <Icon name="arrow" size={18} /></Link>
              <Link to="/login" className="secondary-button">Sign in to your account</Link>
            </div>
          ) : (
            <div className="actions">
              <Link to="/applications" className="primary-button">Open your dashboard <Icon name="arrow" size={18} /></Link>
            </div>
          )}
          <div className="hero-assurance"><span><Icon name="check" size={15} /> Secure submissions</span><span><Icon name="check" size={15} /> Live status tracking</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="portal-window">
            <div className="window-bar"><span/><span/><span/></div>
            <div className="window-content">
              <div className="mock-sidebar"><div className="mock-logo"/><i/><i/><i/></div>
              <div className="mock-main"><small>YOUR APPLICATION</small><div className="mock-title"/><div className="progress-track"><b/><b/><b/></div><div className="mock-card"><Icon name="file" size={24}/><div><strong>National ID request</strong><span>Documents verified</span></div><em>In review</em></div><div className="mock-lines"><i/><i/></div></div>
            </div>
          </div>
          <div className="floating-badge"><span><Icon name="check" size={19}/></span><div><strong>Application received</strong><small>Your submission is secure</small></div></div>
        </div>
      </section>
      <section className="services-section">
        <div className="section-heading"><div><p className="eyebrow">Available online</p><h2>Services built around your needs</h2></div></div>
        <div className="info-grid">
          <article><span className="service-icon"><Icon name="user" size={24}/></span><h3>New national ID</h3><p>Submit your identity details and required residency documents online.</p><span className="service-link">Apply digitally</span></article>
          <article><span className="service-icon"><Icon name="file" size={24}/></span><h3>ID renewal</h3><p>Renew an existing identification card through a guided application.</p><span className="service-link">Simple process </span></article>
          <article><span className="service-icon"><Icon name="shield" size={24}/></span><h3>Birth certificate</h3><p>Request official birth records with secure supporting document uploads.</p><span className="service-link">Secure documents</span></article>
        </div>
      </section>
      <section className="process-strip"><div><span>01</span><p><strong>Create an account</strong><small>Register securely in minutes</small></p></div><i/><div><span>02</span><p><strong>Submit your request</strong><small>Upload the required documents</small></p></div><i/><div><span>03</span><p><strong>Track the progress</strong><small>See clear status updates</small></p></div></section>
    </>
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
    <section className="panel auth-panel">
      <div className="panel-heading"><span className="heading-icon"><Icon name="shield" size={22}/></span><div><p className="eyebrow">Welcome back</p><h2>Sign in to your account</h2><p>Access your applications and service updates.</p></div></div>
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
      <p className="form-footnote">New to Citizen Services? <Link to="/register">Create an account</Link></p>
    </section>
  )
}

function RegisterPage({ setMessage, setError }) {
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', phone_number: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiRequest('/api/v1/auth/register/', { method: 'POST', body: form })
      setMessage('Account created. Please sign in to continue.')
      setForm({ username: '', email: '', full_name: '', password: '', phone_number: '', address: '' })
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel auth-panel auth-panel-wide">
      <div className="panel-heading"><span className="heading-icon"><Icon name="user" size={22}/></span><div><p className="eyebrow">Citizen registration</p><h2>Create your secure account</h2><p>Enter your details to start accessing digital services.</p></div></div>
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
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="form-footnote">Already registered? <Link to="/login">Sign in instead</Link></p>
    </section>
  )
}

function ApplicationsPage({ applications, loading, loadApplications, setMessage, setError, isAdmin, users, usersLoading }) {
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

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Delete this application?')) {
      return
    }

    try {
      await apiRequest(`/api/v1/applications/${applicationId}/`, { method: 'DELETE' })
      setMessage('Application deleted successfully.')
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
            <label>
              Gender
              <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
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
            <label>
              Gender
              <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
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
          <div className="panel-heading compact"><span className="heading-icon"><Icon name="file" size={22}/></span><div><p className="eyebrow">New request</p><h2>Submit an application</h2><p>Choose a service and complete the required information.</p></div></div>
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
        <div className="panel-heading compact"><span className="heading-icon"><Icon name={isAdmin ? 'user' : 'shield'} size={22}/></span><div><p className="eyebrow">{isAdmin ? 'Administration' : 'Your dashboard'}</p><h2>{isAdmin ? 'Review applicants' : 'Your applications'}</h2><p>{isAdmin ? 'Manage citizen records and application decisions.' : 'Follow the progress of each submitted request.'}</p></div></div>
        {loading ? <p>Loading...</p> : null}
        {!loading && applications.length === 0 ? <p>No applications yet.</p> : null}
        {isAdmin ? (
          <>
            {usersLoading ? <p>Loading users...</p> : null}
            {!usersLoading && users.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Full name</th>
                      <th>Phone</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.full_name}</td>
                        <td>{user.phone_number || '—'}</td>
                        <td>{user.address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : (
          <div className="application-list">
            {applications.map((application) => (
              <article key={application.id} className="application-card">
                <div className="application-meta">
                  <strong>{serviceNames[application.application_type] || application.application_type}</strong>
                  <span className={`status-badge status-${application.status?.toLowerCase()}`}>{application.status}</span>
                </div>
                <p>{application.full_name || application.child_full_name || 'Resident'}</p>
                {application.created_at ? <small>Created: {application.created_at.slice(0, 10)}</small> : null}
                <button className="danger-button" type="button" onClick={() => handleDeleteApplication(application.id)}>
                  <Icon name="trash" size={16}/> Delete
                </button>
              </article>
            ))}
          </div>
        )}
        {isAdmin ? (
          <div className="application-list admin-application-list">
            {applications.map((application) => (
              <article key={application.id} className="application-card">
                <div className="application-meta">
                  <strong>{serviceNames[application.application_type] || application.application_type}</strong>
                  <span className={`status-badge status-${application.status?.toLowerCase()}`}>{application.status}</span>
                </div>
                <p>{application.full_name || application.child_full_name || 'Resident'}</p>
                {application.created_at ? <small>Created: {application.created_at.slice(0, 10)}</small> : null}
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
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function ProfilePage({ setMessage, setError }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', address: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const payload = decodeJwtPayload(localStorage.getItem('access_token'))
        const userId = payload?.user_id || payload?.id
        if (!userId) {
          return
        }
        const data = await apiRequest(`/api/v1/auth/users/${userId}/`)
        setCurrentUser(data)
        setForm({
          full_name: data.full_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          password: '',
        })
      } catch (err) {
        setError(err.message)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.password) {
        delete payload.password
      }
      const userId = currentUser?.id
      if (!userId) {
        throw new Error('User not found')
      }
      await apiRequest(`/api/v1/auth/users/${userId}/`, { method: 'PATCH', body: payload })
      setMessage('Profile updated successfully.')
      navigate('/applications')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel profile-panel">
      <div className="panel-heading"><span className="heading-icon"><Icon name="user" size={22}/></span><div><p className="eyebrow">Account settings</p><h2>Personal information</h2><p>Keep your contact details accurate and up to date.</p></div></div>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Full name
          <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label>
          Phone number
          <input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} />
        </label>
        <label>
          Address
          <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={3} />
        </label>
        <label>
          New password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </section>
  )
}

export default App
