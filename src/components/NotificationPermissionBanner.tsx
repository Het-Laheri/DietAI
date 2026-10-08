import React, { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle, AlertCircle, X, Sparkles, Smartphone } from 'lucide-react';
import { mobileNotificationService, NotificationPermissionState } from '../services/mobileNotificationService';

interface NotificationPermissionBannerProps {
  userRole: 'patient' | 'dietician';
  userName?: string;
  className?: string;
}

export default function NotificationPermissionBanner({
  userRole,
  userName,
  className = ''
}: NotificationPermissionBannerProps) {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem(`nutrisnap_dismiss_notif_banner_${userRole}`) === 'true';
  });
  const [requesting, setRequesting] = useState<boolean>(false);
  const [justGranted, setJustGranted] = useState<boolean>(false);

  useEffect(() => {
    setPermission(mobileNotificationService.getPermission());
  }, []);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const res = await mobileNotificationService.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        setJustGranted(true);
        // Subscribe browser PushManager to Web Push notifications
        await mobileNotificationService.subscribeToPushNotifications(userRole).catch(() => {});
        // Show test greeting popup
        await mobileNotificationService.showMobilePopup({
          title: userRole === 'dietician' ? 'Clinical Alerts Enabled' : 'Health Alerts Enabled',
          message: userRole === 'dietician'
            ? 'You will now receive instant phone alerts whenever a patient asks a question or logs food.'
            : 'You will now receive instant phone alerts whenever your dietician updates your plan or replies.',
          link: userRole === 'dietician' ? '/dietician/inbox' : '/patient/meals'
        });
        setTimeout(() => setJustGranted(false), 5000);
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`nutrisnap_dismiss_notif_banner_${userRole}`, 'true');
  };

  // If already granted, or dismissed, or unsupported, show minimal or nothing
  if (permission === 'granted' && !justGranted) {
    return null;
  }

  if (permission === 'unsupported' || (dismissed && !justGranted)) {
    return null;
  }

  if (justGranted) {
    return (
      <div className={`bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 px-4 rounded-xl shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Mobile Notifications Active!</span> You will receive instant phone popups for all changes and messages.
          </div>
        </div>
        <button
          onClick={() => setJustGranted(false)}
          className="text-white/80 hover:text-white p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={`bg-amber-50 border border-amber-200 text-amber-900 p-3 px-4 rounded-xl flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Phone Notifications Blocked:</strong> To receive instant mobile alerts on changes, tap the lock/tune icon in your browser address bar and set <em>Notifications</em> to <em>Allow</em>.
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 p-1"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-3.5 px-4 sm:px-5 rounded-2xl shadow-md shadow-orange-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
          <BellRing className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Enable Mobile Push Notifications</span>
              <Smartphone className="w-3.5 h-3.5 text-orange-200" />
            </h4>
          </div>
          <p className="text-xs text-orange-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
            {userRole === 'dietician'
              ? 'Get instant pop-up alerts on your phone whenever patients ask questions, complete checklists, or log meals.'
              : 'Get instant pop-up alerts on your phone whenever your dietician updates your meal plan, reviews queries, or modifies targets.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          onClick={handleEnable}
          disabled={requesting}
          className="px-3.5 py-1.5 bg-white text-orange-600 hover:bg-orange-50 active:scale-95 transition-all text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          {requesting ? 'Enabling...' : 'Enable Phone Popups'}
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-white/80 hover:text-white rounded-md transition-colors"
          title="Dismiss for now"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
