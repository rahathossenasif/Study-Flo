import React, { useState } from 'react';
import { Smartphone, CheckCircle2, WifiOff, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { useStudyFlow } from '../context/StudyFlowContext';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'compact' | 'card';
}

export function PWAInstallButton({ variant = 'sidebar' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t, showToast } = useStudyFlow();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t.pwa.installed}</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        showToast(t.pwa.installed);
      }
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label={t.pwa.installApp}
          title={t.pwa.installApp}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 min-w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white border border-white/15 shadow-sm shadow-[#7C3AED]/30 text-xs font-semibold transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 stroke-[2.1]" />
          <span className="hidden xs:inline">{t.pwa.installShort}</span>
        </button>
      ) : variant === 'card' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white text-xs font-semibold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>{t.pwa.installApp}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-[#7C3AED]/12 hover:bg-[#7C3AED] text-[#7C3AED] dark:text-[#C4B5FD] hover:text-white border border-[#7C3AED]/30 text-xs font-semibold transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>{t.pwa.installApp}</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={t.pwa.installApp}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.1] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isIOS ? t.pwa.iosTitle : t.pwa.installApp}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label={t.pwa.close}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed list-decimal list-inside">
                <li>{t.pwa.iosStep1}</li>
                <li>{t.pwa.iosStep2}</li>
              </ol>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.pwa.androidHint}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {t.pwa.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { t } = useStudyFlow();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-semibold shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{t.pwa.offlineBanner}</span>
    </div>
  );
}
