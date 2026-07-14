import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';
import { Dialog } from '../components/Dialog';

interface Application {
  id: number;
  application_type: 'NEW_ID' | 'ID_RENEWAL' | 'BIRTH_CERTIFICATE';
  status: 'PENDING' | 'READY' | 'REJECTED';
  created_at: string;
  full_name?: string;
  child_full_name?: string;
  dob?: string;
  gender?: string;
  resident_address?: string;
  phone_number?: string;
  blood_group?: string;
  existing_id_number?: string;
  reason_for_renewal?: string;
  place_of_birth?: string;
  father_full_name?: string;
  mother_full_name?: string;
  photo?: string;
  residence_proof?: string;
  old_id_card?: string;
  hospital_proof?: string;
  parent_id?: string;
  birth_certificate_photo?: string;
  user: number;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  is_admin: boolean;
}

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Application for detail view modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const appData = await apiRequest('/applications/');
      setApplications(appData);

      const userData = await apiRequest('/auth/users/');
      setUsers(userData);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (appId: number, newStatus: 'PENDING' | 'READY' | 'REJECTED') => {
    setUpdatingStatus(true);
    try {
      const updated = await apiRequest(`/applications/${appId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`Application status updated to ${newStatus}!`, 'success');
      
      // Update local state
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      
      // Update selected app reference
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update application status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getFriendlyType = (type: string) => {
    switch (type) {
      case 'NEW_ID': return 'New National ID';
      case 'ID_RENEWAL': return 'National ID Renewal';
      case 'BIRTH_CERTIFICATE': return 'Birth Certificate';
      default: return type;
    }
  };

  const getApplicantName = (app: Application) => {
    return app.full_name || app.child_full_name || 'Resident';
  };

  // Filter application dataset
  const filteredApps = applications.filter(app => {
    const applicantName = getApplicantName(app).toLowerCase();
    const queryMatch = applicantName.includes(searchQuery.toLowerCase()) || 
                       String(app.id).includes(searchQuery) ||
                       (app.existing_id_number && app.existing_id_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const typeMatch = typeFilter === 'ALL' || app.application_type === typeFilter;
    const statusMatch = statusFilter === 'ALL' || app.status === statusFilter;
    return queryMatch && typeMatch && statusMatch;
  });

  // Calculate Metrics
  const metrics = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    ready: applications.filter(a => a.status === 'READY').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  const handleOpenDetail = (app: Application) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedApp(null);
    setIsDetailOpen(false);
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      {/* Metrics Section */}
      <section className="grid grid-cols-4 gap-2" style={{ marginBottom: '32px' }}>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Applications</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px' }}>{metrics.total}</p>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center', borderLeft: '4px solid var(--warning)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>Pending Review</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'var(--warning)' }}>{metrics.pending}</p>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>Ready for Pickup</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'var(--success)' }}>{metrics.ready}</p>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center', borderLeft: '4px solid var(--error)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase' }}>Rejected</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'var(--error)' }}>{metrics.rejected}</p>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('applications')} 
          className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'applications' ? '3px solid var(--primary)' : 'none' }}
        >
          📋 Applications
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : 'none' }}
        >
          👥 Resident Registry
        </button>
      </div>

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <>
          {/* Filters Bar */}
          <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
              <input 
                type="text" 
                placeholder="Search applicant name, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 16px' }}
              />
            </div>
            <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '10px' }}>
                <option value="ALL">All Services</option>
                <option value="NEW_ID">New ID</option>
                <option value="ID_RENEWAL">ID Renewal</option>
                <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
              </select>
            </div>
            <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px' }}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="READY">Ready for Pickup</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {filteredApps.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px' }}>App ID</th>
                    <th style={{ padding: '16px 24px' }}>Applicant</th>
                    <th style={{ padding: '16px 24px' }}>Service Type</th>
                    <th style={{ padding: '16px 24px' }}>Status</th>
                    <th style={{ padding: '16px 24px' }}>Submitted Date</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '16px 24px', fontWeight: 700 }}>#{app.id}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600 }}>{getApplicantName(app)}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>{getFriendlyType(app.application_type)}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge ${
                          app.status === 'PENDING' ? 'badge-pending' :
                          app.status === 'READY' ? 'badge-ready' : 'badge-rejected'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button onClick={() => handleOpenDetail(app)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          Review Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active applications match your filter settings.
              </p>
            )}
          </div>
        </>
      )}

      {/* USERS REGISTRY TAB */}
      {activeTab === 'users' && (
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px' }}>User ID</th>
                <th style={{ padding: '16px 24px' }}>Profile picture</th>
                <th style={{ padding: '16px 24px' }}>Full Name</th>
                <th style={{ padding: '16px 24px' }}>Username</th>
                <th style={{ padding: '16px 24px' }}>Email</th>
                <th style={{ padding: '16px 24px' }}>Phone Number</th>
                <th style={{ padding: '16px 24px' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 700 }}>#{u.id}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {u.profile_picture ? (
                        <img src={u.profile_picture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ padding: '16px 24px' }}>@{u.username}</td>
                  <td style={{ padding: '16px 24px' }}>{u.email}</td>
                  <td style={{ padding: '16px 24px' }}>{u.phone_number || 'N/A'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`badge ${u.is_admin ? 'badge-rejected' : 'badge-ready'}`}>
                      {u.is_admin ? 'Kebele Admin' : 'Resident'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL DIALOG */}
      {selectedApp && (
        <Dialog 
          isOpen={isDetailOpen} 
          onClose={handleCloseDetail} 
          title={`Review Application #${selectedApp.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              {selectedApp.photo ? (
                <img src={selectedApp.photo} alt="Photo" style={{ width: '90px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
              ) : (
                <div style={{ width: '90px', height: '120px', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span>No Photo</span>
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>{getApplicantName(selectedApp)}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Service: <strong>{getFriendlyType(selectedApp.application_type)}</strong>
                </p>
                <div style={{ marginTop: '12px' }}>
                  <span className={`badge ${
                    selectedApp.status === 'PENDING' ? 'badge-pending' :
                    selectedApp.status === 'READY' ? 'badge-ready' : 'badge-rejected'
                  }`}>
                    {selectedApp.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Status updates control */}
            <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <strong style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>Administrative Action</strong>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleUpdateStatus(selectedApp.id, 'READY')}
                  className="btn btn-primary"
                  style={{ flexGrow: 1, backgroundColor: 'var(--success)', padding: '10px' }}
                  disabled={updatingStatus || selectedApp.status === 'READY'}
                >
                  ✓ Approve & Ready
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedApp.id, 'REJECTED')}
                  className="btn btn-danger"
                  style={{ flexGrow: 1, padding: '10px' }}
                  disabled={updatingStatus || selectedApp.status === 'REJECTED'}
                >
                  ✖ Disapprove / Reject
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedApp.id, 'PENDING')}
                  className="btn btn-secondary"
                  style={{ padding: '10px' }}
                  disabled={updatingStatus || selectedApp.status === 'PENDING'}
                >
                  Reset Pending
                </button>
              </div>
            </div>

            {/* Document parameters details */}
            <div>
              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Application Parameters</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                {selectedApp.full_name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Name:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.full_name}</p>
                  </div>
                )}
                {selectedApp.child_full_name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Child's Name:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.child_full_name}</p>
                  </div>
                )}
                {selectedApp.dob && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>DOB:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.dob}</p>
                  </div>
                )}
                {selectedApp.gender && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Gender:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.gender}</p>
                  </div>
                )}
                {selectedApp.phone_number && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.phone_number}</p>
                  </div>
                )}
                {selectedApp.resident_address && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Resident Address:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.resident_address}</p>
                  </div>
                )}
                {selectedApp.blood_group && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.blood_group}</p>
                  </div>
                )}
                {selectedApp.existing_id_number && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Existing ID Number:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.existing_id_number}</p>
                  </div>
                )}
                {selectedApp.reason_for_renewal && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Reason for Renewal:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.reason_for_renewal}</p>
                  </div>
                )}
                {selectedApp.place_of_birth && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Place of Birth:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.place_of_birth}</p>
                  </div>
                )}
                {selectedApp.father_full_name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Father's Full Name:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.father_full_name}</p>
                  </div>
                )}
                {selectedApp.mother_full_name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Mother's Full Name:</span>
                    <p style={{ fontWeight: 600 }}>{selectedApp.mother_full_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document attachments */}
            <div>
              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Applicant Documents</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {selectedApp.residence_proof && (
                  <a href={selectedApp.residence_proof} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    📄 View Residence Proof (PDF)
                  </a>
                )}
                {selectedApp.old_id_card && (
                  <a href={selectedApp.old_id_card} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    🖼️ View Old ID Card
                  </a>
                )}
                {selectedApp.hospital_proof && (
                  <a href={selectedApp.hospital_proof} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    📄 View Hospital Birth notification proof
                  </a>
                )}
                {selectedApp.parent_id && (
                  <a href={selectedApp.parent_id} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    📄 View Parent ID File
                  </a>
                )}
                {selectedApp.birth_certificate_photo && (
                  <a href={selectedApp.birth_certificate_photo} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    🖼️ View Child Photo
                  </a>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}
      <style>{`
        .table-row-hover:hover {
          background-color: var(--bg-surface-elevated);
        }
      `}</style>
    </div>
  );
};
