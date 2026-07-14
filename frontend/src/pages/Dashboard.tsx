import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Spinner, SkeletonCard } from '../components/Spinner';
import { Dialog } from '../components/Dialog';

interface Application {
  id: number;
  application_type: 'NEW_ID' | 'ID_RENEWAL' | 'BIRTH_CERTIFICATE';
  status: 'PENDING' | 'READY' | 'REJECTED';
  created_at: string;
  // Dynamic fields
  full_name?: string;
  child_full_name?: string;
  dob?: string;
  resident_address?: string;
  phone_number?: string;
  blood_group?: string;
  existing_id_number?: string;
  reason_for_renewal?: string;
  place_of_birth?: string;
  father_full_name?: string;
  mother_full_name?: string;
  // Files
  photo?: string;
  residence_proof?: string;
  old_id_card?: string;
  hospital_proof?: string;
  parent_id?: string;
  birth_certificate_photo?: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const fetchApplication = async () => {
    try {
      const data = await apiRequest('/applications/');
      // Django returns a list. Residents only have at most one application.
      if (data && data.length > 0) {
        setApplication(data[0]);
      } else {
        setApplication(null);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load application.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, []);

  const handleCancelApplication = async () => {
    if (!application) return;
    setCanceling(true);
    try {
      await apiRequest(`/applications/${application.id}/`, {
        method: 'DELETE',
      });
      showToast('Application cancelled successfully.', 'success');
      setApplication(null);
      setIsCancelDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to cancel application.', 'error');
    } finally {
      setCanceling(false);
    }
  };

  const getFriendlyType = (type: string) => {
    switch (type) {
      case 'NEW_ID': return 'New National ID';
      case 'ID_RENEWAL': return 'National ID Renewal';
      case 'BIRTH_CERTIFICATE': return 'Birth Certificate Request';
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ marginBottom: '32px' }} className="skeleton" style={{ height: '48px', width: '250px' }}></div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Welcome Bar */}
      <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Resident Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Welcome back, <strong>{user?.full_name}</strong>. Here you can track your service requests.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {user?.is_admin && (
            <Link to="/admin" className="btn btn-secondary">
              🔧 Go to Admin Panel
            </Link>
          )}
          <Link to="/profile" className="btn btn-secondary">
            👤 View Profile
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {application ? (
        <div className="grid grid-cols-3 gap-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Tracker Card */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <span className="badge badge-pending" style={{ fontSize: '0.7rem', marginBottom: '8px' }}>Active Request</span>
                <h2 style={{ fontSize: '1.5rem' }}>{getFriendlyType(application.application_type)}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Submitted on {formatDate(application.created_at)}
                </p>
              </div>
              <span className={`badge ${
                application.status === 'PENDING' ? 'badge-pending' :
                application.status === 'READY' ? 'badge-ready' : 'badge-rejected'
              }`} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                {application.status === 'PENDING' ? 'Pending Review' :
                 application.status === 'READY' ? 'Ready for Pickup' : 'Rejected'}
              </span>
            </div>

            {/* Timeline */}
            <div className="timeline">
              <div className={`timeline-step ${application.status !== 'REJECTED' ? 'completed' : 'rejected'}`}>
                <div className="timeline-dot">✓</div>
                <div className="timeline-label">Submitted</div>
              </div>
              
              <div className={`timeline-step ${
                application.status === 'PENDING' ? 'active' :
                application.status === 'READY' ? 'completed' :
                application.status === 'REJECTED' ? 'rejected' : ''
              }`}>
                <div className="timeline-dot">
                  {application.status === 'PENDING' ? '●' : '✓'}
                </div>
                <div className="timeline-label">Under Review</div>
              </div>
              
              <div className={`timeline-step ${
                application.status === 'READY' ? 'completed' :
                application.status === 'REJECTED' ? 'rejected' : ''
              }`}>
                <div className="timeline-dot">
                  {application.status === 'READY' ? '✓' : '✖'}
                </div>
                <div className="timeline-label">
                  {application.status === 'REJECTED' ? 'Rejected' : 'Ready for Pickup'}
                </div>
              </div>
            </div>

            {/* Warning if rejected */}
            {application.status === 'REJECTED' && (
              <div className="glass" style={{ borderLeft: '4px solid var(--error)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', backgroundColor: 'var(--error-glow)' }}>
                <strong style={{ color: 'var(--error)' }}>Application Disapproved</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Your application did not meet our service guidelines or documents were unclear. Please cancel and re-submit a fresh request with corrected attachments.
                </p>
              </div>
            )}

            {/* Success if ready */}
            {application.status === 'READY' && (
              <div className="glass" style={{ borderLeft: '4px solid var(--success)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', backgroundColor: 'var(--success-glow)' }}>
                <strong style={{ color: 'var(--success)' }}>Document Ready for Pickup!</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Your service document has been processed. Please visit the Kebele Office with your tracking details to collect it.
                </p>
              </div>
            )}

            {/* Application details */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Submitted Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.95rem' }}>
                {application.full_name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
                    <p style={{ fontWeight: 600 }}>{application.full_name}</p>
                  </div>
                )}
                {application.child_full_name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Child's Full Name:</span>
                    <p style={{ fontWeight: 600 }}>{application.child_full_name}</p>
                  </div>
                )}
                {application.dob && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span>
                    <p style={{ fontWeight: 600 }}>{application.dob}</p>
                  </div>
                )}
                {application.phone_number && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Contact Phone:</span>
                    <p style={{ fontWeight: 600 }}>{application.phone_number}</p>
                  </div>
                )}
                {application.resident_address && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Resident Address:</span>
                    <p style={{ fontWeight: 600 }}>{application.resident_address}</p>
                  </div>
                )}
                {application.blood_group && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                    <p style={{ fontWeight: 600 }}>{application.blood_group}</p>
                  </div>
                )}
                {application.existing_id_number && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Existing ID Card Number:</span>
                    <p style={{ fontWeight: 600 }}>{application.existing_id_number}</p>
                  </div>
                )}
                {application.reason_for_renewal && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Reason for Renewal:</span>
                    <p style={{ fontWeight: 600 }}>{application.reason_for_renewal}</p>
                  </div>
                )}
                {application.place_of_birth && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Place of Birth:</span>
                    <p style={{ fontWeight: 600 }}>{application.place_of_birth}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              {application.status === 'PENDING' && (
                <button 
                  onClick={() => navigate('/edit-apply', { state: { application } })} 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  ✏️ Edit Application
                </button>
              )}
              
              {(application.status === 'PENDING' || application.status === 'REJECTED') && (
                <button 
                  onClick={() => setIsCancelDialogOpen(true)} 
                  className="btn btn-danger"
                >
                  {application.status === 'REJECTED' ? '🗑️ Delete Application' : '✕ Cancel Application'}
                </button>
              )}
            </div>
          </div>

          {/* Files List Card */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Submitted Files</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {application.photo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passport Photo</span>
                  <a href={application.photo} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={application.photo} alt="Photo" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', backgroundColor: 'var(--bg-main)' }} />
                  </a>
                </div>
              )}
              {application.residence_proof && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Residence Proof (PDF)</span>
                  <a href={application.residence_proof} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '0.85rem' }}>
                    📄 Open PDF Document
                  </a>
                </div>
              )}
              {application.old_id_card && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Old ID Card Image</span>
                  <a href={application.old_id_card} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '0.85rem' }}>
                    🖼️ View Old ID Card
                  </a>
                </div>
              )}
              {application.hospital_proof && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hospital Birth Notification</span>
                  <a href={application.hospital_proof} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '0.85rem' }}>
                    📄 View Proof Document
                  </a>
                </div>
              )}
              {application.parent_id && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Parent's ID File</span>
                  <a href={application.parent_id} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '0.85rem' }}>
                    📄 View Parent ID File
                  </a>
                </div>
              )}
              {application.birth_certificate_photo && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Birth Certificate Photo</span>
                  <a href={application.birth_certificate_photo} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '0.85rem' }}>
                    🖼️ View Child Photo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass" style={{ padding: '60px 40px', borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '24px' }}>📄</span>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>No Active Service Application</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            You do not currently have any active service application pending. Choose one of our core services below to get started.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <button onClick={() => navigate('/apply?type=NEW_ID')} className="btn btn-secondary" style={{ flexDirection: 'column', padding: '24px 16px', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🪪</span>
              <strong>New ID</strong>
            </button>
            <button onClick={() => navigate('/apply?type=ID_RENEWAL')} className="btn btn-secondary" style={{ flexDirection: 'column', padding: '24px 16px', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🔄</span>
              <strong>ID Renewal</strong>
            </button>
            <button onClick={() => navigate('/apply?type=BIRTH_CERTIFICATE')} className="btn btn-secondary" style={{ flexDirection: 'column', padding: '24px 16px', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>👶</span>
              <strong>Birth Certificate</strong>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog 
        isOpen={isCancelDialogOpen} 
        onClose={() => setIsCancelDialogOpen(false)} 
        title="Confirm Cancellation"
        actions={
          <>
            <button onClick={() => setIsCancelDialogOpen(false)} className="btn btn-secondary" disabled={canceling}>
              Go Back
            </button>
            <button onClick={handleCancelApplication} className="btn btn-danger" disabled={canceling}>
              {canceling ? 'Processing...' : 'Yes, Delete Request'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Are you sure you want to cancel and delete this application? This action is permanent and cannot be undone. All submitted details and files will be deleted from the system.
        </p>
      </Dialog>
    </div>
  );
};
