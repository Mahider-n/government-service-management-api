import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Application {
  id: number;
  application_type: 'NEW_ID' | 'ID_RENEWAL' | 'BIRTH_CERTIFICATE';
  status: 'PENDING' | 'READY' | 'REJECTED';
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
}

export const ApplicationForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Determine if we are editing an existing application or creating a new one
  const existingApp = location.state?.application as Application | undefined;
  const isEditMode = !!existingApp;

  const appType = isEditMode 
    ? existingApp.application_type 
    : (searchParams.get('type') as 'NEW_ID' | 'ID_RENEWAL' | 'BIRTH_CERTIFICATE' || 'NEW_ID');

  const [formData, setFormData] = useState({
    fullName: existingApp?.full_name || '',
    dob: existingApp?.dob || '',
    gender: existingApp?.gender || 'MALE',
    residentAddress: existingApp?.resident_address || '',
    phoneNumber: existingApp?.phone_number || '',
    bloodGroup: existingApp?.blood_group || '',
    existingIdNumber: existingApp?.existing_id_number || '',
    reasonForRenewal: existingApp?.reason_for_renewal || '',
    childFullName: existingApp?.child_full_name || '',
    placeOfBirth: existingApp?.place_of_birth || '',
    fatherFullName: existingApp?.father_full_name || '',
    motherFullName: existingApp?.mother_full_name || '',
  });

  // Files state
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    photo: null,
    residence_proof: null,
    old_id_card: null,
    hospital_proof: null,
    parent_id: null,
    birth_certificate_photo: null,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const getFriendlyType = (type: string) => {
    switch (type) {
      case 'NEW_ID': return 'New National ID';
      case 'ID_RENEWAL': return 'National ID Renewal';
      case 'BIRTH_CERTIFICATE': return 'Birth Certificate';
      default: return type;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateImageDimensions = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const { width, height } = img;
          if (width < 300 || height < 300) {
            resolve("Photo must be at least 1x1 inch (300x300 px). Current: " + width + "x" + height + " px");
          } else if (width > 600 || height > 600) {
            resolve("Photo must be at most 2x2 inch (600x600 px). Current: " + width + "x" + height + " px");
          } else {
            resolve(null); // Valid
          }
        };
        img.onerror = () => resolve("Invalid image file.");
      };
      reader.onerror = () => resolve("Failed to read file.");
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];

      // Perform validation depending on the field
      if (fieldName === 'photo') {
        const dimensionError = await validateImageDimensions(file);
        if (dimensionError) {
          setErrors(prev => ({ ...prev, photo: dimensionError }));
          showToast(dimensionError, 'error');
          e.target.value = ''; // clear
          return;
        } else {
          setErrors(prev => {
            const copy = { ...prev };
            delete copy.photo;
            return copy;
          });
        }
      }

      if (fieldName === 'residence_proof') {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          const errMsg = 'Residence proof must be a PDF file.';
          setErrors(prev => ({ ...prev, residence_proof: errMsg }));
          showToast(errMsg, 'error');
          e.target.value = '';
          return;
        } else {
          setErrors(prev => {
            const copy = { ...prev };
            delete copy.residence_proof;
            return copy;
          });
        }
      }

      setFiles(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Common fields
    if (appType !== 'BIRTH_CERTIFICATE') {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required.';
      if (!formData.residentAddress.trim()) newErrors.residentAddress = 'Resident Address is required.';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required.';
    }

    if (appType === 'NEW_ID') {
      if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood Group is required.';
      if (!isEditMode && !files.photo) newErrors.photo = 'Photo is required.';
      if (!isEditMode && !files.residence_proof) newErrors.residence_proof = 'Residence Proof (PDF) is required.';
    }

    if (appType === 'ID_RENEWAL') {
      if (!formData.existingIdNumber.trim()) newErrors.existingIdNumber = 'Existing ID Number is required.';
      if (!formData.reasonForRenewal.trim()) newErrors.reasonForRenewal = 'Reason for renewal is required.';
      if (!isEditMode && !files.photo) newErrors.photo = 'Photo is required.';
      if (!isEditMode && !files.old_id_card) newErrors.old_id_card = 'Old ID card upload is required.';
    }

    if (appType === 'BIRTH_CERTIFICATE') {
      if (!formData.childFullName.trim()) newErrors.childFullName = 'Child Full Name is required.';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required.';
      if (!formData.placeOfBirth.trim()) newErrors.placeOfBirth = 'Place of Birth is required.';
      if (!formData.fatherFullName.trim()) newErrors.fatherFullName = 'Father\'s Full Name is required.';
      if (!formData.motherFullName.trim()) newErrors.motherFullName = 'Mother\'s Full Name is required.';
      if (!formData.residentAddress.trim()) newErrors.residentAddress = 'Resident Address is required.';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required.';
      if (!isEditMode && !files.hospital_proof) newErrors.hospital_proof = 'Hospital Birth proof is required.';
      if (!isEditMode && !files.parent_id) newErrors.parent_id = 'Parent\'s ID card photo is required.';
      if (!isEditMode && !files.birth_certificate_photo) newErrors.birth_certificate_photo = 'Birth certificate photo is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fill all required fields correctly.', 'error');
      return;
    }

    setSubmitting(true);
    const submitData = new FormData();
    submitData.append('application_type', appType);

    // Map frontend states to exact backend serializer field names
    if (appType !== 'BIRTH_CERTIFICATE') {
      submitData.append('full_name', formData.fullName);
      submitData.append('dob', formData.dob);
      submitData.append('gender', formData.gender);
      submitData.append('resident_address', formData.residentAddress);
      submitData.append('phone_number', formData.phoneNumber);
    }

    if (appType === 'NEW_ID') {
      submitData.append('blood_group', formData.bloodGroup);
    } else if (appType === 'ID_RENEWAL') {
      submitData.append('existing_id_number', formData.existingIdNumber);
      submitData.append('reason_for_renewal', formData.reasonForRenewal);
    } else if (appType === 'BIRTH_CERTIFICATE') {
      submitData.append('child_full_name', formData.childFullName);
      submitData.append('dob', formData.dob);
      submitData.append('gender', formData.gender);
      submitData.append('place_of_birth', formData.placeOfBirth);
      submitData.append('father_full_name', formData.fatherFullName);
      submitData.append('mother_full_name', formData.motherFullName);
      submitData.append('resident_address', formData.residentAddress);
      submitData.append('phone_number', formData.phoneNumber);
    }

    // Append file objects if they are selected
    Object.keys(files).forEach((key) => {
      const file = files[key];
      if (file) {
        submitData.append(key, file);
      }
    });

    try {
      if (isEditMode) {
        // Use PATCH so unchanged fields/files are preserved by DRF
        await apiRequest(`/applications/${existingApp.id}/`, {
          method: 'PATCH',
          body: submitData,
        });
        showToast('Application updated successfully!', 'success');
      } else {
        await apiRequest('/applications/', {
          method: 'POST',
          body: submitData,
        });
        showToast('Application submitted successfully!', 'success');
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.details) {
        const backendErrors: { [key: string]: string } = {};
        Object.keys(err.details).forEach((key) => {
          const detail = err.details[key];
          // Map backend snake_case key to camelCase where applicable
          let displayKey = key;
          if (key === 'full_name') displayKey = 'fullName';
          if (key === 'child_full_name') displayKey = 'childFullName';
          if (key === 'resident_address') displayKey = 'residentAddress';
          if (key === 'phone_number') displayKey = 'phoneNumber';
          if (key === 'blood_group') displayKey = 'bloodGroup';
          if (key === 'existing_id_number') displayKey = 'existingIdNumber';
          if (key === 'reason_for_renewal') displayKey = 'reasonForRenewal';
          if (key === 'place_of_birth') displayKey = 'placeOfBirth';
          if (key === 'father_full_name') displayKey = 'fatherFullName';
          if (key === 'mother_full_name') displayKey = 'motherFullName';

          backendErrors[displayKey] = Array.isArray(detail) ? detail[0] : String(detail);
        });
        setErrors(backendErrors);
        showToast('Submission failed. Check highlighted errors.', 'error');
      } else {
        showToast(err.message || 'Submission failed. Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '750px', padding: '40px 0' }}>
      <div className="glass" style={{ padding: '40px', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
          {isEditMode ? 'Edit Application' : 'Submit New Application'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Service: <strong>{getFriendlyType(appType)}</strong>
        </p>

        <form onSubmit={handleSubmit} novalidate>
          {/* DYNAMIC FORM SEGMENT 1: NEW ID / ID RENEWAL (PERSONAL DETAILS) */}
          {appType !== 'BIRTH_CERTIFICATE' && (
            <>
              <div className="form-group">
                <label htmlFor="fullName" className="required">Full Name (Ethiopian Passport format)</label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Abebe Bikila"
                  required
                />
                <span className="error-message">{errors.fullName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
                <div className="form-group">
                  <label htmlFor="dob" className="required">Date of Birth</label>
                  <input 
                    type="date" 
                    id="dob" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="error-message">{errors.dob}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="required">Gender</label>
                  <select 
                    id="gender" 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <span className="error-message">{errors.gender}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
                <div className="form-group">
                  <label htmlFor="phoneNumber" className="required">Contact Phone Number</label>
                  <input 
                    type="tel" 
                    id="phoneNumber" 
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+251911223344"
                    required
                  />
                  <span className="error-message">{errors.phoneNumber}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="residentAddress" className="required">Kebele Resident Address</label>
                  <input 
                    type="text" 
                    id="residentAddress" 
                    name="residentAddress"
                    value={formData.residentAddress}
                    onChange={handleInputChange}
                    placeholder="Bole, Woreda 03, House 405"
                    required
                  />
                  <span className="error-message">{errors.residentAddress}</span>
                </div>
              </div>
            </>
          )}

          {/* DYNAMIC FORM SEGMENT 2: SPECIFIC FIELDS FOR NEW ID */}
          {appType === 'NEW_ID' && (
            <div className="form-group">
              <label htmlFor="bloodGroup" className="required">Blood Group</label>
              <select 
                id="bloodGroup" 
                name="bloodGroup" 
                value={formData.bloodGroup} 
                onChange={handleInputChange}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <span className="error-message">{errors.bloodGroup}</span>
            </div>
          )}

          {/* DYNAMIC FORM SEGMENT 3: SPECIFIC FIELDS FOR ID RENEWAL */}
          {appType === 'ID_RENEWAL' && (
            <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
              <div className="form-group">
                <label htmlFor="existingIdNumber" className="required">Existing ID Number</label>
                <input 
                  type="text" 
                  id="existingIdNumber" 
                  name="existingIdNumber"
                  value={formData.existingIdNumber}
                  onChange={handleInputChange}
                  placeholder="KBL-03-99182"
                  required
                />
                <span className="error-message">{errors.existingIdNumber}</span>
              </div>

              <div className="form-group">
                <label htmlFor="reasonForRenewal" className="required">Reason for Renewal</label>
                <input 
                  type="text" 
                  id="reasonForRenewal" 
                  name="reasonForRenewal"
                  value={formData.reasonForRenewal}
                  onChange={handleInputChange}
                  placeholder="Lost card / Expired validity"
                  required
                />
                <span className="error-message">{errors.reasonForRenewal}</span>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM SEGMENT 4: SPECIFIC FIELDS FOR BIRTH CERTIFICATE */}
          {appType === 'BIRTH_CERTIFICATE' && (
            <>
              <div className="form-group">
                <label htmlFor="childFullName" className="required">Child's Full Name</label>
                <input 
                  type="text" 
                  id="childFullName" 
                  name="childFullName"
                  value={formData.childFullName}
                  onChange={handleInputChange}
                  placeholder="Lensa Abebe"
                  required
                />
                <span className="error-message">{errors.childFullName}</span>
              </div>

              <div className="grid grid-cols-3 gap-2" style={{ gap: '0 16px' }}>
                <div className="form-group">
                  <label htmlFor="dob" className="required">Date of Birth</label>
                  <input 
                    type="date" 
                    id="dob" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="error-message">{errors.dob}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="required">Gender</label>
                  <select 
                    id="gender" 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <span className="error-message">{errors.gender}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="placeOfBirth" className="required">Place of Birth (Hospital/City)</label>
                  <input 
                    type="text" 
                    id="placeOfBirth" 
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleInputChange}
                    placeholder="Tikur Anbessa Hospital"
                    required
                  />
                  <span className="error-message">{errors.placeOfBirth}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
                <div className="form-group">
                  <label htmlFor="fatherFullName" className="required">Father's Full Name</label>
                  <input 
                    type="text" 
                    id="fatherFullName" 
                    name="fatherFullName"
                    value={formData.fatherFullName}
                    onChange={handleInputChange}
                    placeholder="Abebe Bikila"
                    required
                  />
                  <span className="error-message">{errors.fatherFullName}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="motherFullName" className="required">Mother's Full Name</label>
                  <input 
                    type="text" 
                    id="motherFullName" 
                    name="motherFullName"
                    value={formData.motherFullName}
                    onChange={handleInputChange}
                    placeholder="Derartu Tulu"
                    required
                  />
                  <span className="error-message">{errors.motherFullName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2" style={{ gap: '0 16px' }}>
                <div className="form-group">
                  <label htmlFor="phoneNumber" className="required">Contact Phone Number</label>
                  <input 
                    type="tel" 
                    id="phoneNumber" 
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+251911223344"
                    required
                  />
                  <span className="error-message">{errors.phoneNumber}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="residentAddress" className="required">Resident Address</label>
                  <input 
                    type="text" 
                    id="residentAddress" 
                    name="residentAddress"
                    value={formData.residentAddress}
                    onChange={handleInputChange}
                    placeholder="Bole, Woreda 03, House 405"
                    required
                  />
                  <span className="error-message">{errors.residentAddress}</span>
                </div>
              </div>
            </>
          )}

          {/* ATTACHMENTS FIELD SECTION */}
          <h3 style={{ fontSize: '1.2rem', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Required Documents
          </h3>

          {/* NEW ID OR ID RENEWAL PHOTO UPLOAD */}
          {appType !== 'BIRTH_CERTIFICATE' && (
            <div className="form-group">
              <label className={isEditMode ? '' : 'required'}>Digital Passport Photo (Image, 1x1 to 2x2 inch)</label>
              <div className="file-upload-card">
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {files.photo ? files.photo.name : 'Drag or click to choose passport photo'}
                </span>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} />
              </div>
              <span className="error-message">{errors.photo}</span>
              {existingApp?.photo && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently: <a href={existingApp.photo} target="_blank" rel="noreferrer">photo_card_view</a></p>}
            </div>
          )}

          {/* NEW ID SPECIFIC RESIDENCE PROOF */}
          {appType === 'NEW_ID' && (
            <div className="form-group">
              <label className={isEditMode ? '' : 'required'}>Residence Proof Document (PDF Format Only)</label>
              <div className="file-upload-card">
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {files.residence_proof ? files.residence_proof.name : 'Choose residence proof PDF'}
                </span>
                <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'residence_proof')} />
              </div>
              <span className="error-message">{errors.residence_proof}</span>
              {existingApp?.residence_proof && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently: <a href={existingApp.residence_proof} target="_blank" rel="noreferrer">residence_proof_file</a></p>}
            </div>
          )}

          {/* ID RENEWAL SPECIFIC OLD ID */}
          {appType === 'ID_RENEWAL' && (
            <div className="form-group">
              <label className={isEditMode ? '' : 'required'}>Old ID Card Photo</label>
              <div className="file-upload-card">
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {files.old_id_card ? files.old_id_card.name : 'Upload old ID card image'}
                </span>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'old_id_card')} />
              </div>
              <span className="error-message">{errors.old_id_card}</span>
              {existingApp?.old_id_card && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently: <a href={existingApp.old_id_card} target="_blank" rel="noreferrer">old_id_card_file</a></p>}
            </div>
          )}

          {/* BIRTH CERTIFICATE ATTACHMENTS */}
          {appType === 'BIRTH_CERTIFICATE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className={isEditMode ? '' : 'required'}>Hospital Birth Notification Document</label>
                <div className="file-upload-card">
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {files.hospital_proof ? files.hospital_proof.name : 'Upload hospital proof file'}
                  </span>
                  <input type="file" onChange={(e) => handleFileChange(e, 'hospital_proof')} />
                </div>
                <span className="error-message">{errors.hospital_proof}</span>
                {existingApp?.hospital_proof && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently: <a href={existingApp.hospital_proof} target="_blank" rel="noreferrer">hospital_proof_file</a></p>}
              </div>

              <div className="form-group">
                <label className={isEditMode ? '' : 'required'}>Parent's National ID Card (Photo/PDF)</label>
                <div className="file-upload-card">
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {files.parent_id ? files.parent_id.name : 'Upload copy of parent\'s ID'}
                  </span>
                  <input type="file" onChange={(e) => handleFileChange(e, 'parent_id')} />
                </div>
                <span className="error-message">{errors.parent_id}</span>
                {existingApp?.parent_id && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently: <a href={existingApp.parent_id} target="_blank" rel="noreferrer">parent_id_file</a></p>}
              </div>

              <div className="form-group">
                <label className={isEditMode ? '' : 'required'}>Child Photograph</label>
                <div className="file-upload-card">
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {files.birth_certificate_photo ? files.birth_certificate_photo.name : 'Upload child photograph'}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'birth_certificate_photo')} />
                </div>
                <span className="error-message">{errors.birth_certificate_photo}</span>
                {existingApp?.birth_certificate_photo && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently: <a href={existingApp.birth_certificate_photo} target="_blank" rel="noreferrer">child_photo_file</a></p>}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting Request...' : (isEditMode ? 'Save Changes' : 'Submit Application')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
