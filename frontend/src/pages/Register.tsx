import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Basic type validation
      if (!file.type.startsWith('image/')) {
        showToast('Only image files are allowed for profile pictures.', 'error');
        return;
      }
      
      // Basic size validation (e.g. max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Profile picture size must be under 5MB.', 'error');
        return;
      }

      setProfilePicture(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    
    // Create FormData object to handle file upload
    const submitData = new FormData();
    submitData.append('username', formData.username);
    submitData.append('email', formData.email);
    submitData.append('full_name', formData.fullName);
    submitData.append('password', formData.password);
    
    if (formData.phoneNumber) submitData.append('phone_number', formData.phoneNumber);
    if (formData.address) submitData.append('address', formData.address);
    if (profilePicture) submitData.append('profile_picture', profilePicture);

    try {
      await register(submitData);
      showToast('Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      if (err.details) {
        // Backend validation errors mapping
        const backendErrors: { [key: string]: string } = {};
        Object.keys(err.details).forEach((key) => {
          const detail = err.details[key];
          const displayKey = key === 'full_name' ? 'fullName' : key;
          backendErrors[displayKey] = Array.isArray(detail) ? detail[0] : String(detail);
        });
        setErrors(backendErrors);
        showToast('Please fix the errors in the form.', 'error');
      } else {
        showToast(err.message || 'Registration failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '40px 0' }}>
      <div className="glass" style={{ padding: '40px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '550px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.95rem' }}>
          Register as a Kebele resident to start applying online
        </p>

        <form onSubmit={handleSubmit} novalidate>
          <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
            <div className="form-group">
              <label htmlFor="username" className="required">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="johndoe"
                required
              />
              <span className="error-message">{errors.username}</span>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="required">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
              />
              <span className="error-message">{errors.email}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fullName" className="required">Full Name (as in certificate)</label>
            <input 
              type="text" 
              id="fullName" 
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="John Doe"
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
                placeholder="+251912345678"
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
                placeholder="Subcity, Woreda, Kebele 03"
              />
              <span className="error-message">{errors.address}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
            <div className="form-group">
              <label htmlFor="password" className="required">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
              <span className="error-message">{errors.password}</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="required">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
              <span className="error-message">{errors.confirmPassword}</span>
            </div>
          </div>

          {/* Profile Picture Upload */}
          <div className="form-group">
            <label>Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden',
                border: '2px solid var(--border)'
              }}>
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.5rem' }}>👤</span>
                )}
              </div>
              <div className="file-upload-card" style={{ flexGrow: 1, padding: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {profilePicture ? profilePicture.name : 'Choose Profile Image'}
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? 'Registering Account...' : 'Register Account'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};
