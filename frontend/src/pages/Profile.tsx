import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phoneNumber: user?.phone_number || '',
    address: user?.address || '',
    password: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.profile_picture || null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        showToast('Only image files are allowed.', 'error');
        return;
      }
      setProfilePicture(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setSubmitting(true);
    const submitData = new FormData();
    submitData.append('full_name', formData.fullName);
    submitData.append('username', user.username);
    submitData.append('email', user.email);
    
    if (formData.phoneNumber) submitData.append('phone_number', formData.phoneNumber);
    if (formData.address) submitData.append('address', formData.address);
    if (formData.password) submitData.append('password', formData.password);
    if (profilePicture) submitData.append('profile_picture', profilePicture);

    try {
      await apiRequest(`/auth/users/${user.id}/`, {
        method: 'PATCH',
        body: submitData,
      });
      showToast('Profile updated successfully!', 'success');
      await refreshUser(); // Sync auth context
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err: any) {
      console.error(err);
      if (err.details) {
        const backendErrors: { [key: string]: string } = {};
        Object.keys(err.details).forEach((key) => {
          const detail = err.details[key];
          const displayKey = key === 'full_name' ? 'fullName' : key;
          backendErrors[displayKey] = Array.isArray(detail) ? detail[0] : String(detail);
        });
        setErrors(backendErrors);
        showToast('Update failed. Check highlights.', 'error');
      } else {
        showToast(err.message || 'Failed to update profile.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '700px', padding: '40px 0' }}>
      <div className="glass" style={{ padding: '40px', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>My Profile</h1>

        <form onSubmit={handleSubmit} novalidate>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div style={{ 
              width: '96px', 
              height: '96px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden',
              border: '3px solid var(--primary)',
              boxShadow: 'var(--primary-glow)'
            }}>
              {profilePreview ? (
                <img src={profilePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.5rem' }}>👤</span>
              )}
            </div>
            
            <div style={{ flexGrow: 1 }}>
              <h3 style={{ fontSize: '1.25rem' }}>{user?.full_name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{user?.username} • {user?.email}</p>
              <div className="file-upload-card" style={{ padding: '10px 16px', marginTop: '12px', display: 'inline-flex', width: 'auto' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Upload New Photo</span>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fullName" className="required">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
            <span className="error-message">{errors.fullName}</span>
          </div>

          <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input 
                type="tel" 
                id="phoneNumber" 
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
              <span className="error-message">{errors.phoneNumber}</span>
            </div>

            <div className="form-group">
              <label htmlFor="address">Resident Address</label>
              <input 
                type="text" 
                id="address" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
              <span className="error-message">{errors.address}</span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.15rem', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Change Password
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Leave blank if you do not wish to update your password.
          </p>

          <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
              <span className="error-message">{errors.password}</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
              <span className="error-message">{errors.confirmPassword}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
