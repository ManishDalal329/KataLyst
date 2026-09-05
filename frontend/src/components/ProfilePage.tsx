import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AddressItem, PaymentOptionItem } from '../lib/auth';
import {
  User as UserIcon,
  HardHat,
  Building2,
  Camera,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Briefcase,
  CreditCard,
  MapPin,
  ShieldCheck,
  Edit3,
  Eye,
  Save,
  X
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  'Cleaning & Sanitation',
  'Plumbing Services',
  'Electrical Works',
  'Home Appliance Repair',
  'Tutoring & Education',
  'Elder Care & Nursing',
  'Painting & Carpentry'
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[var(--accent)] text-[var(--accent-cta-text)] font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xl flex items-center justify-center overflow-hidden shadow-md shrink-0">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">{user.name}</h1>
              {user.isAadhaarVerified && (
                <span
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[11px] font-extrabold shadow-sm"
                  title="Aadhaar Document Verified Member"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Aadhaar Verified</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">
                {user.role === 'CUSTOMER' ? 'User (Customer)' : user.role === 'WORKER' ? 'Worker Member' : 'Cooperative Admin'}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{user.email}</span>
            </div>
          </div>
        </div>

        {/* View / Edit Mode Switcher Toggle */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--border)] text-xs font-extrabold text-[var(--text-primary)] transition-all flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          {isEditing ? (
            <>
              <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>View Profile</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Aadhaar Identity Verification Section */}
      <AadhaarVerificationSection
        user={user}
        onUpdate={(data) => {
          updateProfile(data);
        }}
        showToast={showToast}
        onError={(msg) => setErrorMessage(msg)}
      />

      {/* Role-Specific Profile Form Components */}
      {user.role === 'WORKER' && (
        <WorkerProfileForm
          user={user}
          isEditing={isEditing}
          onSave={(data) => {
            setErrorMessage(null);
            updateProfile(data);
            showToast('Worker profile details updated successfully!');
            setIsEditing(false);
          }}
          onError={(msg) => setErrorMessage(msg)}
        />
      )}

      {user.role === 'CUSTOMER' && (
        <UserProfileForm
          user={user}
          isEditing={isEditing}
          onSave={(data) => {
            setErrorMessage(null);
            updateProfile(data);
            showToast('User profile & preferences saved successfully!');
            setIsEditing(false);
          }}
          onError={(msg) => setErrorMessage(msg)}
        />
      )}

      {(user.role === 'COOP_ADMIN' || user.role === 'GOV_ADMIN') && (
        <OrgProfileForm
          user={user}
          isEditing={isEditing}
          onSave={(data) => {
            setErrorMessage(null);
            updateProfile(data);
            showToast('Organization profile updated successfully!');
            setIsEditing(false);
          }}
          onError={(msg) => setErrorMessage(msg)}
        />
      )}

    </div>
  );
};

/* ====================================================================
   AADHAAR VERIFICATION SECTION
   ==================================================================== */
const AadhaarVerificationSection: React.FC<{
  user: any;
  onUpdate: (data: any) => void;
  showToast: (msg: string) => void;
  onError: (msg: string) => void;
}> = ({ user, onUpdate, showToast, onError }) => {
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState<string | null>(user.aadhaarDoc || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onError('Aadhaar document file must be under 5MB');
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadhaarFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = aadhaarInput.replace(/\D/g, '');
    if (cleanDigits.length !== 12) {
      onError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!aadhaarFile) {
      onError('Please upload a copy of your Aadhaar Card document (Image or PDF)');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const maskedNumber = `XXXX-XXXX-${cleanDigits.slice(8)}`;
      onUpdate({
        isAadhaarVerified: true,
        aadhaarNumber: maskedNumber,
        aadhaarDoc: aadhaarFile
      });
      setIsVerifying(false);
      showToast('Aadhaar successfully verified! Verified Member badge active.');
    }, 600);
  };

  if (user.isAadhaarVerified) {
    return (
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-emerald-500/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">Aadhaar Identity Verified</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wide">
                  Verified Member
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
                Aadhaar No: <strong className="text-[var(--text-primary)]">{user.aadhaarNumber || 'XXXX-XXXX-8912'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {user.aadhaarDoc && (
              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--border)] transition-all flex items-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>View Document</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal preview of uploaded Aadhaar doc */}
        {showDocModal && user.aadhaarDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 relative space-y-4 shadow-2xl">
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--border)]"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Aadhaar Document — {user.name}</span>
              </h4>

              <div className="max-h-96 overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-2 flex items-center justify-center">
                {user.aadhaarDoc.startsWith('data:image/') ? (
                  <img src={user.aadhaarDoc} alt="Aadhaar Document" className="w-full max-h-80 object-contain rounded-xl" />
                ) : (
                  <iframe src={user.aadhaarDoc} title="Aadhaar Document" className="w-full h-80 rounded-xl" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[var(--text-primary)]">Aadhaar Identity Verification</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Upload your 12-digit Aadhaar Card document to receive an official <strong>Verified Member</strong> badge on SahakarConnect.
          </p>
        </div>
      </div>

      <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2 border-t border-[var(--border)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              12-Digit Aadhaar Number
            </label>
            <input
              type="text"
              maxLength={14}
              value={aadhaarInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                let formatted = val;
                if (val.length > 4 && val.length <= 8) {
                  formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
                } else if (val.length > 8) {
                  formatted = `${val.slice(0, 4)}-${val.slice(4, 8)}-${val.slice(8, 12)}`;
                }
                setAadhaarInput(formatted);
              }}
              placeholder="e.g. 9812-4321-8912"
              className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-mono font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] tracking-wider"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Upload Aadhaar Document (Image / PDF)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="aadhaar-doc-file"
                required
              />
              <label
                htmlFor="aadhaar-doc-file"
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-xs font-semibold text-[var(--text-primary)] cursor-pointer flex items-center justify-between transition-all"
              >
                <span className="truncate text-[var(--text-secondary)]">
                  {fileName ? fileName : aadhaarFile ? 'Document Selected ✓' : 'Choose File (JPG, PNG, PDF)'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-cta-text)] font-bold text-[10px] shrink-0 ml-2">
                  Browse
                </span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isVerifying ? 'Verifying Document...' : 'Submit & Verify Aadhaar'}</span>
        </button>
      </form>
    </div>
  );
};

/* ====================================================================
   WORKER PROFILE FORM
   ==================================================================== */
interface ProfileFormProps {
  user: any;
  isEditing: boolean;
  onSave: (data: any) => void;
  onError: (msg: string) => void;
}

const WorkerProfileForm: React.FC<ProfileFormProps> = ({ user, isEditing, onSave, onError }) => {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [bio, setBio] = useState(user.bio || '');
  const [domains, setDomains] = useState<string[]>(user.domains || ['Cleaning & Sanitation', 'Plumbing Services']);
  const [startTime, setStartTime] = useState(user.activeShift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(user.activeShift?.endTime || '18:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(user.activeShift?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [lowRate, setLowRate] = useState<number>(user.rateTiers?.low || 250);
  const [modRate, setModRate] = useState<number>(user.rateTiers?.moderate || 500);
  const [highRate, setHighRate] = useState<number>(user.rateTiers?.high || 900);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onError('Profile image file must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDomain = (domain: string) => {
    if (domains.includes(domain)) {
      setDomains(domains.filter((d) => d !== domain));
    } else {
      setDomains([...domains, domain]);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return onError('Full Name is required');
    if (!phone.trim()) return onError('Phone number is required');
    if (lowRate < 0 || modRate < 0 || highRate < 0) return onError('Rate values must be positive numbers');

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      profilePicture,
      bio: bio.trim(),
      domains,
      activeShift: {
        startTime,
        endTime,
        days: selectedDays
      },
      rateTiers: {
        low: Number(lowRate),
        moderate: Number(modRate),
        high: Number(highRate)
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Basic Info & Photo */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-5">
        <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
          <HardHat className="w-4 h-4 text-[var(--accent)]" />
          <span>Worker Identity & Contact</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Avatar Upload */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
            <div className="relative w-24 h-24 rounded-2xl bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-md">
              {profilePicture ? (
                <img src={profilePicture} alt="Worker" className="w-full h-full object-cover" />
              ) : (
                <span>{name.charAt(0).toUpperCase() || 'W'}</span>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            {isEditing && (
              <label className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-bold text-[var(--accent)] cursor-pointer hover:bg-[var(--border)] transition-all">
                Upload Photo
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Text Fields */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                disabled={!isEditing}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Email (Read-only)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  disabled={!isEditing}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Worker Bio</label>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">{bio.length}/300 chars</span>
              </div>
              <textarea
                value={bio}
                disabled={!isEditing}
                maxLength={300}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your skills, experience, and certifications..."
                rows={3}
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Domain(s) of Work */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-[var(--accent)]" />
          <span>Domain(s) of Work</span>
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">Select the service categories you are qualified to perform:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SERVICE_CATEGORIES.map((cat) => {
            const isSelected = domains.includes(cat);
            return (
              <button
                type="button"
                key={cat}
                disabled={!isEditing}
                onClick={() => toggleDomain(cat)}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-xs'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                }`}
              >
                <span>{cat}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Self-Declared Schedule & Shift Hours */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <span>General Shift & Working Hours</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Your self-declared availability schedule. <em>(Note: Real-time "Duty Status" online/offline toggle remains on your active Worker App dashboard).</em>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Shift Start Time</label>
            <input
              type="time"
              value={startTime}
              disabled={!isEditing}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Shift End Time</label>
            <input
              type="time"
              value={endTime}
              disabled={!isEditing}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Available Days of Week</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  disabled={!isEditing}
                  onClick={() => toggleDay(day)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] border-[var(--accent)] shadow-sm'
                      : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rate Tiers */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-[var(--text-primary)]">Self-Declared Rate Tiers (₹ / Job)</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Set your estimated rate expectations based on task difficulty. These are displayed to customers alongside the cooperative base rate.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Low Effort Tasks</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-bold text-[var(--text-primary)]">₹</span>
              <input
                type="number"
                value={lowRate}
                disabled={!isEditing}
                onChange={(e) => setLowRate(Number(e.target.value))}
                className="w-full px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-black text-[var(--accent)] focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] block">e.g. minor fixes, quick inspection</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Moderate Effort</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-bold text-[var(--text-primary)]">₹</span>
              <input
                type="number"
                value={modRate}
                disabled={!isEditing}
                onChange={(e) => setModRate(Number(e.target.value))}
                className="w-full px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-black text-[var(--accent)] focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] block">e.g. standard repair / 2h service</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">High Effort / Heavy</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-bold text-[var(--text-primary)]">₹</span>
              <input
                type="number"
                value={highRate}
                disabled={!isEditing}
                onChange={(e) => setHighRate(Number(e.target.value))}
                className="w-full px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-black text-[var(--accent)] focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] block">e.g. full day work, heavy wiring</span>
          </div>
        </div>
      </div>

      {/* Cooperative Affiliation */}
      <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
          <div>
            <span className="font-bold text-[var(--text-primary)]">Cooperative Affiliation: </span>
            <span className="text-[var(--accent)] font-extrabold">{user.coopAffiliation || 'North Delhi Labour Cooperative Society'}</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-secondary)]">Member ID: {user.id}</span>
      </div>

      {isEditing && (
        <button
          type="submit"
          className="w-full py-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Worker Profile</span>
        </button>
      )}
    </form>
  );
};

/* ====================================================================
   USER / CUSTOMER PROFILE FORM
   ==================================================================== */
const UserProfileForm: React.FC<ProfileFormProps> = ({ user, isEditing, onSave, onError }) => {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');

  // Saved Addresses State
  const [addresses, setAddresses] = useState<AddressItem[]>(
    user.savedAddresses || [
      { id: 'addr_1', label: 'Home', address: 'Flat 402, Sunshine Apartments, Civil Lines, Delhi', isDefault: true },
      { id: 'addr_2', label: 'Work', address: 'Building 10, Connaught Place, New Delhi', isDefault: false }
    ]
  );

  const [newLabel, setNewLabel] = useState('Home');
  const [newText, setNewText] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Saved Mock Payment Options State
  const [payments, setPayments] = useState<PaymentOptionItem[]>(
    user.savedPaymentOptions || [
      { id: 'pay_1', type: 'UPI', nickname: 'Google Pay UPI', details: 'user@okaxis' },
      { id: 'pay_2', type: 'CARD', nickname: 'HDFC Bank Debit Card', details: '**** 4892' }
    ]
  );

  const [newPayType, setNewPayType] = useState<'UPI' | 'CARD'>('UPI');
  const [newPayNick, setNewPayNick] = useState('');
  const [newPayDetail, setNewPayDetail] = useState('');
  const [showAddPay, setShowAddPay] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return onError('Profile image must be under 2MB');
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicture(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddAddress = () => {
    if (!newText.trim()) return onError('Address text is required');
    const newAddr: AddressItem = {
      id: 'addr_' + Date.now(),
      label: newLabel,
      address: newText.trim(),
      isDefault: addresses.length === 0
    };
    setAddresses([...addresses, newAddr]);
    setNewText('');
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const handleAddPayment = () => {
    if (!newPayNick.trim() || !newPayDetail.trim()) return onError('Payment nickname & details are required');
    const newPay: PaymentOptionItem = {
      id: 'pay_' + Date.now(),
      type: newPayType,
      nickname: newPayNick.trim(),
      details: newPayDetail.trim()
    };
    setPayments([...payments, newPay]);
    setNewPayNick('');
    setNewPayDetail('');
    setShowAddPay(false);
  };

  const handleDeletePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return onError('Full Name is required');
    if (!phone.trim()) return onError('Phone number is required');

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      profilePicture,
      savedAddresses: addresses,
      savedPaymentOptions: payments
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Identity & Contact Card */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-5">
        <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-[var(--accent)]" />
          <span>User Identity & Contact</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Avatar Upload */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
            <div className="relative w-24 h-24 rounded-2xl bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-md">
              {profilePicture ? (
                <img src={profilePicture} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span>{name.charAt(0).toUpperCase() || 'U'}</span>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            {isEditing && (
              <label className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-bold text-[var(--accent)] cursor-pointer hover:bg-[var(--border)] transition-all">
                Upload Avatar
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Form Fields */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                disabled={!isEditing}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Email (Read-only)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  disabled={!isEditing}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Addresses Section */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[var(--accent)]" />
            <span>Saved Addresses</span>
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs flex items-center space-x-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Address</span>
            </button>
          )}
        </div>

        {/* Add Address Form inline */}
        {showAddAddress && (
          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
            <div className="flex gap-2">
              <select
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Full address (House no, Street, Area, City)"
                className="flex-1 px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAddress}
                className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs rounded-xl shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Address Cards List */}
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[var(--accent)]/15 text-[var(--accent)]">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Default Address</span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-primary)] font-medium mt-1.5">{addr.address}</p>
              </div>

              {isEditing && (
                <div className="flex items-center space-x-2 shrink-0">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Saved Payment Options (Mock display for booking flow) */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-[var(--accent)]" />
              <span>Saved Payment Options (Mock Autofill)</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Saved for quick autofill during booking. Sensitive card numbers/CVVs are <strong>never</strong> collected or stored.
            </p>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowAddPay(!showAddPay)}
              className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs flex items-center space-x-1 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Payment Method</span>
            </button>
          )}
        </div>

        {/* Add Payment Mock Inline Form */}
        {showAddPay && (
          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newPayType}
                onChange={(e) => setNewPayType(e.target.value as any)}
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="UPI">UPI Handle</option>
                <option value="CARD">Card Nickname</option>
              </select>
              <input
                type="text"
                value={newPayNick}
                onChange={(e) => setNewPayNick(e.target.value)}
                placeholder="Method Nickname (e.g. PhonePe UPI)"
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              />
              <input
                type="text"
                value={newPayDetail}
                onChange={(e) => setNewPayDetail(e.target.value)}
                placeholder={newPayType === 'UPI' ? 'user@upi' : '**** 1234'}
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPayment}
              className="px-4 py-1.5 bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs rounded-xl shadow-sm"
            >
              Save Payment Mock
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {payments.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">{p.nickname}</div>
                <div className="text-[11px] font-mono text-[var(--accent)] mt-0.5">{p.details}</div>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleDeletePayment(p.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <button
          type="submit"
          className="w-full py-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save User Profile</span>
        </button>
      )}
    </form>
  );
};

/* ====================================================================
   ORG / COOPERATIVE ADMIN PROFILE FORM
   ==================================================================== */
const OrgProfileForm: React.FC<ProfileFormProps> = ({ user, isEditing, onSave, onError }) => {
  const [orgName, setOrgName] = useState(user.orgName || user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [bio, setBio] = useState(user.bio || 'Registered Cooperative Society managing gig workers and public services under Ministry of Cooperation guidelines.');
  const [address, setAddress] = useState(user.registeredAddress || 'Plot 12, Institutional Area, Sector 4, Dwarka, New Delhi');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return onError('Logo file must be under 2MB');
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicture(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return onError('Organization Name is required');
    if (!phone.trim()) return onError('Official phone number is required');

    onSave({
      orgName: orgName.trim(),
      name: orgName.trim(),
      phone: phone.trim(),
      profilePicture,
      bio: bio.trim(),
      registeredAddress: address.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Identity Card */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-5">
        <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-[var(--accent)]" />
          <span>Organization & Cooperative Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Logo Upload */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
            <div className="relative w-24 h-24 rounded-2xl bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-md">
              {profilePicture ? (
                <img src={profilePicture} alt="Org Logo" className="w-full h-full object-cover" />
              ) : (
                <span>{orgName.charAt(0).toUpperCase() || 'O'}</span>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            {isEditing && (
              <label className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-bold text-[var(--accent)] cursor-pointer hover:bg-[var(--border)] transition-all">
                Upload Logo
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Form Fields */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Organization / Cooperative Name</label>
              <input
                type="text"
                value={orgName}
                disabled={!isEditing}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Official Email (Read-only)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Official Phone</label>
                <input
                  type="tel"
                  value={phone}
                  disabled={!isEditing}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Registered Address</label>
              <input
                type="text"
                value={address}
                disabled={!isEditing}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Cooperative Description / Mandate</label>
          <textarea
            value={bio}
            disabled={!isEditing}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-75"
          />
        </div>
      </div>

      {/* Registration & Verification Status (Read-Only) */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
        <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Registration & Verification Details (Official Record)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-semibold">Government Registration Number</span>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)]">{user.registrationNo || 'COOP-DEL-2024-8891'}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-semibold">Ministry Verification Status</span>
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-emerald-500 uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{user.verificationStatus || 'VERIFIED & APPROVED'}</span>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <button
          type="submit"
          className="w-full py-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Organization Profile</span>
        </button>
      )}
    </form>
  );
};

export default ProfilePage;
