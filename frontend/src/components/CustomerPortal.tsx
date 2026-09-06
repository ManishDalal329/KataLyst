import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Star, Sparkles, CheckCircle2, Clock, Calendar, Info,
  ShieldCheck, DollarSign, X, ArrowRight, Bookmark, Loader2,
  UserCheck, AlertCircle, ChevronDown, ChevronUp, Bell, Ban
} from 'lucide-react';
import {
  WORK_LEVELS,
  calculatePriceBreakdown,
  getProblemTypesForCategory
} from '../config/bookingConfig';

const WORKER_AVATARS: Record<string, string> = {
  'Amit Kumar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'Ravi Malhotra': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'Pooja Verma': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'Meena Devi': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'Sanjay Singh': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'Lakshmi Narayan': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
  'Kavitha Reddy': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
  'Ananth Murthy': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
  'Vijay Salunkhe': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'Ganesh Shinde': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250'
};

const COVER_GRADIENTS = [
  'from-[#E8E2D9] via-[#D5CCBF] to-[#A89680]/60',
  'from-[#D5CCBF] via-[#A89680]/50 to-[#8B7355]/40',
  'from-[#F4F0EA] via-[#E8E2D9] to-[#D5CCBF]',
  'from-[#A89680]/40 via-[#D5CCBF] to-[#E8E2D9]',
];

const FALLBACK_CATEGORIES = [
  { id: 'cat-1', name: 'Cleaning & Sanitation', base_rate: 699.0 },
  { id: 'cat-2', name: 'Plumbing Services', base_rate: 499.0 },
  { id: 'cat-3', name: 'Electrical Works', base_rate: 549.0 },
  { id: 'cat-4', name: 'Academic Tutoring', base_rate: 800.0 },
  { id: 'cat-5', name: 'Elder & Caregiving', base_rate: 1200.0 },
  { id: 'cat-6', name: 'Appliance Repair', base_rate: 750.0 }
];

export const CustomerPortal: React.FC = () => {
  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();

  // Categories & Selection
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<any>(FALLBACK_CATEGORIES[1]); // Default to Plumbing

  // 1. Request Form State
  const [selectedProblemType, setSelectedProblemType] = useState<string>('Leak Repair');
  const [customProblemType, setCustomProblemType] = useState<string>('');
  const [workLevel, setWorkLevel] = useState<'LOW' | 'MODERATE' | 'HIGH'>('MODERATE');
  
  // Compute minimum datetime allowed (current local time)
  const getMinDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };
  const minDateTimeLocal = getMinDateTimeLocal();

  const [scheduledTime, setScheduledTime] = useState<string>(
    new Date(Date.now() + 3600000 * 2).toISOString().slice(0, 16)
  );
  const [address, setAddress] = useState<string>('Flat 402, Green Park Heights, Sector 14');
  const [instructions, setInstructions] = useState<string>('Main kitchen pipe is leaking, please bring sealant and pipe wrenches');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [requestSuccessNotice, setRequestSuccessNotice] = useState<string>('');

  // Live Online Workers Count State
  const [onlineWorkersCount, setOnlineWorkersCount] = useState<number>(0);
  const [loadingOnlineCount, setLoadingOnlineCount] = useState<boolean>(false);

  // 2. Customer Raised Requests State
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);

  // Active Selected Request for Viewing Accepted Workers
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [isConfirmingWorker, setIsConfirmingWorker] = useState<string | null>(null);

  // Timeline expanded cards set
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  // Cancellation State
  const [cancellingRequest, setCancellingRequest] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState<boolean>(false);

  // Rating State
  const [ratingRequest, setRatingRequest] = useState<any | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('Prompt, transparent, and skilled cooperative worker!');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  // In-app real-time notification toasts
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: Date }>>([]);

  // Tooltip hover state for AI match explanation
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Ref to always have latest loadMyRequests in socket listeners without stale closures
  const loadMyRequestsRef = React.useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    loadCategories();
    if (user) {
      loadMyRequests();
      const socket = getSocket();
      socket.emit('join_room', `user_${user.id}`);
    }
  }, [user]);

  // Update Problem Type default when category changes
  useEffect(() => {
    if (selectedCategory) {
      const problemTypes = getProblemTypesForCategory(selectedCategory.name);
      if (problemTypes.length > 0) {
        setSelectedProblemType(problemTypes[0]);
        setCustomProblemType('');
      }
    }
  }, [selectedCategory]);

  // Load online workers count when category or problem type changes
  useEffect(() => {
    if (selectedCategory) {
      fetchOnlineWorkersCount(selectedCategory, selectedProblemType);
    }
  }, [selectedCategory, selectedProblemType]);

  // WebSocket subscriptions for live real-time updates & notifications
  useEffect(() => {
    const socket = getSocket();

    // Listen for customer notifications (e.g. worker accepted or declined)
    const handleCustomerNotification = (data: any) => {
      const newNotif = {
        id: Math.random().toString(),
        message: data.message || 'A worker responded to your request!',
        timestamp: new Date()
      };
      setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
      // Auto-dismiss notification after 6 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 6000);

      loadMyRequestsRef.current();
    };

    // Listen for global request updates
    const handleGlobalUpdate = () => {
      loadMyRequestsRef.current();
      if (selectedCategory) {
        fetchOnlineWorkersCount(selectedCategory, selectedProblemType);
      }
    };

    const handleAvailabilityChange = () => {
      if (selectedCategory) {
        fetchOnlineWorkersCount(selectedCategory, selectedProblemType);
      }
    };

    const handleWorkerDeclined = () => {
      loadMyRequestsRef.current();
    };

    socket.on('customer_notification', handleCustomerNotification);
    socket.on('global_request_update', handleGlobalUpdate);
    socket.on('worker_availability_changed', handleAvailabilityChange);
    socket.on('request_worker_declined', handleWorkerDeclined);
    socket.on('request_status_changed', handleWorkerDeclined);

    return () => {
      socket.off('customer_notification', handleCustomerNotification);
      socket.off('global_request_update', handleGlobalUpdate);
      socket.off('worker_availability_changed', handleAvailabilityChange);
      socket.off('request_worker_declined', handleWorkerDeclined);
      socket.off('request_status_changed', handleWorkerDeclined);
    };
  }, [selectedCategory, selectedProblemType]);

  const loadCategories = async () => {
    try {
      const data = await fetchApi('/categories');
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        if (!selectedCategory) {
          setSelectedCategory(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const fetchOnlineWorkersCount = async (cat: any, probType: string) => {
    setLoadingOnlineCount(true);
    try {
      const queryProb = probType === 'Others' ? '' : probType;
      const query = `?categoryId=${encodeURIComponent(cat.id)}&categoryName=${encodeURIComponent(cat.name)}&problemType=${encodeURIComponent(queryProb || '')}`;
      const data = await fetchApi(`/requests/online-workers${query}`);
      if (data && typeof data.count === 'number') {
        setOnlineWorkersCount(data.count);
      }
    } catch (e) {
      console.error('Failed to fetch online workers count', e);
    } finally {
      setLoadingOnlineCount(false);
    }
  };

  const loadMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await fetchApi('/requests/mine');
      if (Array.isArray(data)) {
        setMyRequests(data);
        // If viewing request modal is open, refresh viewingRequest with fresh data
        setViewingRequest((prev: any) => {
          if (!prev) return null;
          const updated = data.find((r: any) => r.id === prev.id);
          return updated || null;
        });
      }
    } catch (e) {
      console.error('Failed to load my requests', e);
    } finally {
      setLoadingRequests(false);
    }
  };
  loadMyRequestsRef.current = loadMyRequests;

  // 1. Submit Raise Request
  const handleRaiseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await quickLoginAs('9900112233', 'CUSTOMER');
    }

    if (!selectedCategory) return;

    // Date & Time validation: reject any selection earlier than current date-time
    const selectedDate = new Date(scheduledTime);
    if (isNaN(selectedDate.getTime()) || selectedDate.getTime() < Date.now() - 60000) {
      alert(t('past_datetime_error') || 'Scheduled date and time cannot be earlier than current date and time.');
      return;
    }

    // Problem type handling: if "Others", require and capture custom problem specification
    let problemTypeToSubmit = selectedProblemType;
    if (selectedProblemType === 'Others') {
      if (!customProblemType.trim()) {
        alert('Please specify your problem in the text field.');
        return;
      }
      problemTypeToSubmit = `Others - ${customProblemType.trim()}`;
    }

    setIsSubmittingRequest(true);
    setRequestSuccessNotice('');
    try {
      const result = await fetchApi('/requests', {
        method: 'POST',
        body: JSON.stringify({
          category_id: selectedCategory.id,
          problem_type: problemTypeToSubmit,
          work_level: workLevel,
          scheduled_time: scheduledTime,
          address,
          instructions
        })
      });

      setRequestSuccessNotice(t('request_raised_success'));
      setCustomProblemType('');
      loadMyRequests();
      setTimeout(() => {
        setRequestSuccessNotice('');
      }, 4000);
    } catch (e: any) {
      alert(e.message || t('error'));
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // 2. Confirm Worker
  const handleConfirmWorker = async (requestId: string, workerId: string) => {
    setIsConfirmingWorker(workerId);
    try {
      await fetchApi(`/requests/${requestId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ worker_id: workerId })
      });
      await loadMyRequests();
      setViewingRequest(null);
    } catch (e: any) {
      alert(e.message || t('error'));
    } finally {
      setIsConfirmingWorker(null);
    }
  };

  // 3. Cancel Request
  const handleCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingRequest || !cancellationReason.trim()) return;

    setIsSubmittingCancellation(true);
    try {
      await fetchApi(`/requests/${cancellingRequest.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancellationReason.trim() })
      });
      setCancellingRequest(null);
      setCancellationReason('');
      if (viewingRequest?.id === cancellingRequest.id) {
        setViewingRequest(null);
      }
      loadMyRequests();
    } catch (e: any) {
      alert(e.message || t('error'));
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  // 4. Rate Service
  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingRequest) return;
    setIsSubmittingRating(true);
    try {
      await fetchApi(`/requests/${ratingRequest.id}/rate`, {
        method: 'POST',
        body: JSON.stringify({
          score: ratingScore,
          comment: ratingComment
        })
      });
      setRatingRequest(null);
      loadMyRequests();
    } catch (e: any) {
      alert(e.message || t('error'));
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const toggleTimeline = (requestId: string) => {
    setExpandedTimelines(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            {t('status_completed')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
            {t('status_in_progress')}
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-800 border border-blue-200">
            {t('confirm')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-red-800 border border-red-200">
            {t('status_cancelled')}
          </span>
        );
      case 'RAISED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stone-100 text-stone-700 border border-stone-200">
            {t('status_raised')}
          </span>
        );
    }
  };

  // Price calculations for current form selection
  const currentBaseRate = selectedCategory?.base_rate || 499.0;
  const currentPriceBreakdown = calculatePriceBreakdown(currentBaseRate, workLevel);
  const currentProblemTypes = selectedCategory ? getProblemTypesForCategory(selectedCategory.name) : [];

  return (
    <div className="space-y-10 py-4 relative">

      {/* Floating In-App Notifications Toast Stack */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
          {notifications.map(n => (
            <div
              key={n.id}
              className="p-4 rounded-2xl bg-[#2B2824] text-white shadow-2xl border border-[#6E675F] flex items-start space-x-3 animate-slideIn pointer-events-auto"
            >
              <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1 text-xs">
                <div className="font-extrabold text-white">Cooperative Update</div>
                <div className="text-stone-300 mt-0.5">{n.message}</div>
              </div>
              <button
                onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Customer Header Banner */}
      <div className="p-6 rounded-3xl border border-[#E8E2D9] bg-gradient-to-r from-white via-[#FAF8F5] to-[#F4F0EA] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#8B7355]" />
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{t('cust_portal_title')}</h1>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">{t('request_form_sub')}</p>
        </div>

        {/* Quick Cooperative Trust Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E2D9] text-xs font-extrabold text-[#6B4F3B]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>80% Worker Share • Zero Middleman Markup</span>
        </div>
      </div>

      {/* 1. Category Selection Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#2B2824]">{t('service_categories')}</h2>
            <p className="text-xs text-[#6E675F]">Select a category to customize your service request</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border text-center ${
                  isSelected
                    ? 'border-[#6B4F3B] bg-[#F4F0EA] shadow-md scale-[1.02]'
                    : 'border-[#E8E2D9] bg-white hover:border-[#8B7355] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="text-xs font-bold text-[#2B2824] mb-1 truncate">{cat.name}</div>
                <div className="text-[11px] font-extrabold text-[#6B4F3B]">₹{cat.base_rate} {t('base_rate_label')}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Request Form (Replaces Worker Grid) */}
      <section className="rounded-3xl border border-[#E8E2D9] bg-white shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#E8E2D9] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-extrabold text-[#8B7355] uppercase tracking-wider">Step 2: Define Service Needs</span>
            <h2 className="text-xl font-extrabold text-[#2B2824] mt-0.5">
              {selectedCategory ? `${selectedCategory.name} Request` : t('request_form_title')}
            </h2>
          </div>
          <div className="text-xs text-[#6E675F]">
            Base Rate: <strong className="text-[#2B2824] font-black">₹{currentBaseRate}</strong>
          </div>
        </div>

        {requestSuccessNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{requestSuccessNotice}</span>
          </div>
        )}

        <form onSubmit={handleRaiseRequest} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Field / Problem Type Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                {t('problem_type_label')} *
              </label>
              <select
                value={selectedProblemType}
                onChange={(e) => {
                  setSelectedProblemType(e.target.value);
                  if (e.target.value !== 'Others') {
                    setCustomProblemType('');
                  }
                }}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B] shadow-sm"
                required
              >
                {currentProblemTypes.map((prob, idx) => (
                  <option key={idx} value={prob}>{prob}</option>
                ))}
              </select>

              {/* Requirement 1: Conditionally rendered text input directly below dropdown visible ONLY when "Others" is selected */}
              {selectedProblemType === 'Others' && (
                <div className="pt-2 animate-fadeIn space-y-1">
                  <label className="block text-[11px] font-bold text-[#8B7355] uppercase tracking-wider">
                    Specify Your Problem *
                  </label>
                  <input
                    type="text"
                    value={customProblemType}
                    onChange={(e) => setCustomProblemType(e.target.value)}
                    placeholder="Please specify your problem"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border-2 border-[#6B4F3B] rounded-2xl text-xs font-bold text-[#2B2824] focus:outline-none shadow-sm"
                    required
                  />
                </div>
              )}

              {/* Live Count of Currently Online Workers */}
              <div className="pt-1 flex items-center space-x-2 text-xs">
                {loadingOnlineCount ? (
                  <div className="flex items-center space-x-1 text-[#857E75]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B7355]" />
                    <span>Checking worker availability...</span>
                  </div>
                ) : onlineWorkersCount > 0 ? (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>
                      {t('workers_online_count', { count: onlineWorkersCount, field: selectedProblemType || selectedCategory?.name })}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>
                      {t('no_workers_online', { field: selectedProblemType || selectedCategory?.name })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled Date & Time (Requirement 4: Disable past dates in picker) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                {t('scheduled_time_label')} *
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                min={minDateTimeLocal}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B] shadow-sm"
                required
              />
              <p className="text-[11px] text-[#857E75]">Workers can respond anytime prior to this slot.</p>
            </div>

          </div>

          {/* Explain Your Problem (Requirement 2: Relocated before Low/Moderate/High pricing cards) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
              {t('instructions_label')}
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Kitchen tap is leaking continuously since morning"
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-semibold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B] shadow-sm"
            />
          </div>

          {/* Work Level Multiplier Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
              {t('work_level_label')} (Centralized Multiplier Architecture)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(WORK_LEVELS) as Array<'LOW' | 'MODERATE' | 'HIGH'>).map((lvlKey) => {
                const lvl = WORK_LEVELS[lvlKey];
                const isSelected = workLevel === lvlKey;
                const levelPrice = Number((currentBaseRate * lvl.multiplier).toFixed(2));
                return (
                  <div
                    key={lvlKey}
                    onClick={() => setWorkLevel(lvlKey)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                      isSelected
                        ? 'border-[#6B4F3B] bg-[#F4F0EA] shadow-md ring-1 ring-[#6B4F3B]'
                        : 'border-[#E8E2D9] bg-[#FAF8F5] hover:bg-[#F4F0EA]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#2B2824]">{lvl.defaultLabel}</span>
                      <span className="text-xs font-black text-[#6B4F3B]">₹{levelPrice}</span>
                    </div>
                    <p className="text-[11px] text-[#6E675F]">{lvl.defaultDescription}</p>
                    <div className="text-[10px] text-[#857E75] pt-1">
                      Worker payout: <strong>₹{(levelPrice * 0.80).toFixed(2)}</strong> (80%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transparent 80/15/5 Value Distribution Card */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#6B4F3B] border-b border-[#E8E2D9] pb-2">
              <ShieldCheck className="w-4 h-4 text-[#8B7355]" />
              <span>{t('transparent_price_breakdown')} ({workLevel} Level • ₹{currentPriceBreakdown.total.toFixed(2)})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div>
                <span className="text-[#6E675F]">{t('worker_gets_share')} (80%):</span>
                <div className="text-sm font-extrabold text-[#2B2824]">₹{currentPriceBreakdown.workerShare.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[#6E675F]">{t('coop_fund_share')} (15%):</span>
                <div className="text-sm font-extrabold text-[#8B7355]">₹{currentPriceBreakdown.coopFund.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[#6E675F]">{t('platform_fee_share')} (5%):</span>
                <div className="text-sm font-extrabold text-[#6E675F]">₹{currentPriceBreakdown.platformFee.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Service Address Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
              {t('address_label')} *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('address_placeholder')}
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-semibold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmittingRequest}
            className="w-full py-4 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmittingRequest ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('raising_request')}</span>
              </>
            ) : (
              <>
                <span>{t('raise_request_btn')} (₹{currentPriceBreakdown.total.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </section>

      {/* 3. My Raised Requests Section */}
      <section className="space-y-6 pt-6 border-t border-[#E8E2D9]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-[#2B2824]">{t('my_raised_requests_title')}</h2>
            <p className="text-xs text-[#6E675F]">{t('my_raised_requests_sub')}</p>
          </div>
          <button
            onClick={loadMyRequests}
            className="text-xs font-extrabold text-[#6B4F3B] hover:underline"
          >
            Refresh Responses
          </button>
        </div>

        {loadingRequests ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="p-6 rounded-3xl bg-white border border-[#E8E2D9] animate-pulse h-28"></div>
            ))}
          </div>
        ) : myRequests.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-[#E8E2D9] text-center space-y-2">
            <Bookmark className="w-8 h-8 text-[#8B7355] mx-auto opacity-40" />
            <div className="text-sm font-bold text-[#2B2824]">No Service Requests Raised Yet</div>
            <p className="text-xs text-[#6E675F] max-w-md mx-auto">
              Select a category above and click &quot;Raise Request&quot; to broadcast your requirement to cooperative gig workers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map((reqItem) => {
              const isTimelineOpen = !!expandedTimelines[reqItem.id];
              const acceptedWorkers = reqItem.acceptedWorkers || [];
              const totalAcceptedCount = reqItem.totalAcceptedCount || 0;
              const isAwaiting = reqItem.status === 'RAISED';

              return (
                <div
                  key={reqItem.id}
                  className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  {/* Card Header Row */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#E8E2D9] pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-[#2B2824] text-base">
                          {reqItem.category?.name} • <span className="text-[#6B4F3B]">{reqItem.problem_type}</span>
                        </span>
                        {getStatusBadge(reqItem.status)}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-[#E8E2D9] text-[#6E675F]">
                          {reqItem.work_level} Level
                        </span>
                      </div>

                      <div className="text-xs text-[#6E675F] mt-1 flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8B7355]" />
                          <span>{new Date(reqItem.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B7355]" />
                          <span>{reqItem.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-[#6B4F3B]">₹{reqItem.amount.toFixed(2)}</div>
                      <div className="text-[10px] text-[#857E75]">80% Worker Share: ₹{(reqItem.amount * 0.80).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Dynamic Response Indicator or Confirmed Worker Information */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {isAwaiting && (
                        <div className="flex items-center space-x-2">
                          {totalAcceptedCount > 0 ? (
                            <span className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>🟢 {totalAcceptedCount} worker(s) accepted (capped at 5 fastest)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                              <span>🟡 Waiting for worker responses</span>
                            </span>
                          )}
                        </div>
                      )}

                      {reqItem.status === 'CONFIRMED' && reqItem.selected_worker && (
                        <div className="text-xs text-[#2B2824] font-semibold">
                          Confirmed Worker: <strong className="text-[#6B4F3B]">{reqItem.selected_worker.user?.name}</strong> ({reqItem.selected_worker.cooperative?.name})
                        </div>
                      )}

                      {reqItem.status === 'IN_PROGRESS' && reqItem.selected_worker && (
                        <div className="text-xs text-amber-800 font-bold flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                          <span>Work in Progress with {reqItem.selected_worker.user?.name}</span>
                        </div>
                      )}

                      {reqItem.status === 'COMPLETED' && reqItem.selected_worker && (
                        <div className="text-xs text-emerald-800 font-bold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Completed by {reqItem.selected_worker.user?.name}</span>
                        </div>
                      )}

                      {reqItem.status === 'CANCELLED' && (
                        <div className="text-xs text-red-700 font-semibold flex items-center space-x-1.5">
                          <Ban className="w-3.5 h-3.5 text-red-500" />
                          <span>Cancelled by {reqItem.cancelled_by}: &quot;{reqItem.cancellation_reason}&quot;</span>
                        </div>
                      )}

                      {/* Soft informational notice for open > 24 hours */}
                      {reqItem.showWaitingNotice && (
                        <p className="text-[11px] text-[#857E75] mt-1.5 bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E2D9]">
                          ℹ️ {t('waiting_soft_notice')}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Customer opens request to see dynamic accepted cards */}
                      {isAwaiting && (
                        <button
                          onClick={() => setViewingRequest(reqItem)}
                          className="px-4 py-2 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white text-xs font-extrabold shadow-sm transition-all flex items-center space-x-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>
                            {totalAcceptedCount > 0 ? `View ${totalAcceptedCount} Worker Response(s)` : 'View Request Details'}
                          </span>
                        </button>
                      )}

                      {/* Cancel Request (before work starts) */}
                      {(reqItem.status === 'RAISED' || reqItem.status === 'CONFIRMED') && (
                        <button
                          onClick={() => setCancellingRequest(reqItem)}
                          className="px-3.5 py-2 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-[#6E675F] text-xs font-bold transition-all border border-[#E8E2D9]"
                        >
                          {t('cancel_request_btn')}
                        </button>
                      )}

                      {/* Rate Service Button */}
                      {reqItem.status === 'COMPLETED' && !reqItem.booking?.rating && (
                        <button
                          onClick={() => setRatingRequest(reqItem)}
                          className="px-4 py-2 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-extrabold shadow-sm transition-all flex items-center space-x-1"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Rate Worker</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 7. Compact Status & Timeline Expander */}
                  <div className="pt-2 border-t border-[#E8E2D9]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-[#857E75]">
                        Timeline: <strong className="text-[#2B2824]">{reqItem.timeline?.length || 1} milestone(s)</strong> recorded
                      </div>
                      <button
                        onClick={() => toggleTimeline(reqItem.id)}
                        className="inline-flex items-center space-x-1 text-[#6B4F3B] font-extrabold hover:underline"
                      >
                        <span>{isTimelineOpen ? t('show_less_timeline') : t('show_more_timeline')}</span>
                        {isTimelineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expanded Chronological Milestones Timeline */}
                    {isTimelineOpen && (
                      <div className="mt-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3 animate-fadeIn">
                        <div className="text-[11px] font-extrabold text-[#6E675F] uppercase tracking-wider">
                          Full Request Audit Trail
                        </div>

                        <div className="space-y-2.5">
                          {reqItem.timeline?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-start space-x-3 text-xs">
                              <div className="w-2 h-2 rounded-full bg-[#6B4F3B] mt-1.5 shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#2B2824]">{item.title}</span>
                                  <span className="text-[11px] font-mono text-[#857E75]">
                                    {new Date(item.timestamp).toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#6E675F]">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Modal: Dynamic Accepted Worker Cards (Capped at 5 Fastest) */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-6">
            
            <button
              onClick={() => setViewingRequest(null)}
              className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824] p-1.5 rounded-full hover:bg-[#F4F0EA]"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F4F0EA] text-[#6B4F3B] text-[11px] font-extrabold mb-1">
                <span>{viewingRequest.category?.name}</span>
                <span>•</span>
                <span>{viewingRequest.problem_type}</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#2B2824]">{t('accepted_workers_title')}</h3>
              <p className="text-xs text-[#6E675F] mt-0.5">
                {t('accepted_workers_sub')} — rewards faster cooperative members. Pick one to confirm.
              </p>
            </div>

            {/* Request Summary Strip */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[#6E675F]">Work Level: </span>
                <strong className="text-[#2B2824]">{viewingRequest.work_level}</strong>
              </div>
              <div>
                <span className="text-[#6E675F]">Scheduled For: </span>
                <strong className="text-[#2B2824]">{new Date(viewingRequest.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </div>
              <div>
                <span className="text-[#6E675F]">Total Payable: </span>
                <strong className="text-[#6B4F3B] text-sm">₹{viewingRequest.amount.toFixed(2)}</strong>
              </div>
            </div>

            {/* Dynamic Worker Cards (1 to 5) */}
            {viewingRequest.acceptedWorkers?.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-center space-y-2">
                <AlertCircle className="w-7 h-7 text-[#8B7355] mx-auto opacity-50" />
                <div className="text-xs font-bold text-[#2B2824]">Still waiting for workers to accept</div>
                <p className="text-[11px] text-[#6E675F] max-w-sm mx-auto">
                  Your request is active and broadcast to all registered workers. You will be notified in real-time when workers respond.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingRequest.acceptedWorkers.map((acc: any, index: number) => {
                  const worker = acc.worker;
                  const workerName = worker?.user?.name || 'Worker Member';
                  const avatarUrl = WORKER_AVATARS[workerName] || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`;
                  const gradientCover = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
                  const isConfirmingThis = isConfirmingWorker === worker.id;

                  return (
                    <div
                      key={acc.id}
                      className="rounded-3xl border border-[#E8E2D9] bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Gradient Banner */}
                        <div className={`h-16 bg-gradient-to-r ${gradientCover} p-2 flex justify-between items-start`}>
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[9px] font-bold text-[#2B2824]">
                            <ShieldCheck className="w-3 h-3 text-[#8B7355]" />
                            <span>Verified Member</span>
                          </span>

                          {/* Smart Match Score Badge with Tooltip */}
                          <div className="relative">
                            <div
                              onMouseEnter={() => setActiveTooltipId(worker.id)}
                              onMouseLeave={() => setActiveTooltipId(null)}
                              className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#6B4F3B] text-white text-[10px] font-bold cursor-pointer"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                              <span>{worker.matchScore || 95}% Match</span>
                            </div>

                            {activeTooltipId === worker.id && worker.matchBreakdown && (
                              <div className="absolute right-0 top-6 z-30 w-56 p-2.5 rounded-xl bg-[#2B2824] border border-[#6E675F] shadow-2xl text-[10px] text-[#FAF8F5] space-y-1 pointer-events-none">
                                <div className="font-bold text-white border-b border-[#524B43] pb-1 flex justify-between">
                                  <span>AI Match Formula</span>
                                  <span className="text-amber-300">{worker.matchScore}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Proximity (35%):</span>
                                  <span>{worker.matchBreakdown.proximityScore}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Rating (25%):</span>
                                  <span>{worker.matchBreakdown.ratingScore}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Reliability (15%):</span>
                                  <span>{worker.matchBreakdown.reliabilityScore ?? 100}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Availability (15%):</span>
                                  <span>{worker.matchBreakdown.availabilityScore}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Skill Match (10%):</span>
                                  <span>{worker.matchBreakdown.skillMatchScore ?? 100}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Avatar & Name */}
                        <div className="px-4 -mt-7 flex items-end space-x-3 mb-2">
                          <img
                            src={avatarUrl}
                            alt={workerName}
                            className="w-14 h-14 rounded-full border-3 border-white object-cover shadow-sm bg-white"
                          />
                          <div>
                            <h4 className="font-extrabold text-[#2B2824] text-sm leading-tight">{workerName}</h4>
                            <p className="text-[11px] font-semibold text-[#8B7355]">{worker.cooperative?.name}</p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="px-4 space-y-2 text-xs">
                          <div className="flex items-center space-x-1 text-[#6E675F] text-[11px]">
                            <MapPin className="w-3 h-3 text-[#8B7355]" />
                            <span>{worker.cooperative?.district}, {worker.cooperative?.state}</span>
                          </div>

                          {/* Rating & Acceptance Time */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#E8E2D9]">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-extrabold text-[#2B2824]">{worker.rating_avg?.toFixed(1) || '4.9'}</span>
                            </div>
                            <span className="text-[10px] text-[#857E75]">
                              Accepted {new Date(acc.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Confirm Worker CTA */}
                      <div className="p-4 pt-3">
                        <button
                          onClick={() => handleConfirmWorker(viewingRequest.id, worker.id)}
                          disabled={isConfirmingThis}
                          className="w-full py-2.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                        >
                          {isConfirmingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{t('confirming_worker')}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t('confirm_worker_btn')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingRequest(null)}
                className="px-5 py-2 rounded-full border border-[#E8E2D9] text-xs font-bold text-[#6E675F] hover:bg-[#F4F0EA]"
              >
                {t('close')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Modal: Cancellation Flow with Required Reason */}
      {cancellingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            
            <button
              onClick={() => setCancellingRequest(null)}
              className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#2B2824]">{t('cancel_modal_title')}</h3>
              <p className="text-xs text-[#6E675F] mt-0.5">
                {cancellingRequest.category?.name} • {cancellingRequest.problem_type}
              </p>
            </div>

            <form onSubmit={handleCancelRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                  {t('cancel_reason_label')}
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder={t('cancel_reason_placeholder')}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs text-[#2B2824] focus:outline-none focus:border-red-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingRequest(null)}
                  className="flex-1 py-2.5 rounded-full border border-[#E8E2D9] text-xs font-bold text-[#6E675F] hover:bg-[#F4F0EA]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!cancellationReason.trim() || isSubmittingCancellation}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingCancellation ? t('loading') : t('confirm_cancel_btn')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 6. Modal: Post-Completion Rating */}
      {ratingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            
            <button
              onClick={() => setRatingRequest(null)}
              className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-extrabold text-[#2B2824]">{t('rate_modal_title')}</h3>
              <p className="text-xs text-[#6E675F] mt-0.5">
                Rate your service experience with {ratingRequest.selected_worker?.user?.name || 'Worker'}
              </p>
            </div>

            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <div className="flex justify-center space-x-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    onClick={() => setRatingScore(s)}
                    className={`w-8 h-8 cursor-pointer transition-all ${
                      s <= ratingScore ? 'text-amber-500 fill-amber-500 scale-110' : 'text-[#D5CCBF]'
                    }`}
                  />
                ))}
              </div>

              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                rows={3}
                placeholder={t('rate_comment_placeholder')}
              />

              <button
                type="submit"
                disabled={isSubmittingRating}
                className="w-full py-3 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md transition-all"
              >
                {isSubmittingRating ? t('loading') : t('submit_rating_btn')}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerPortal;
