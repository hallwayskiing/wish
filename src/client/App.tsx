import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import './styles/style.css';
import './styles/wish.css';
import './styles/poetic.css';
import './styles/modal.css';
import './styles/api-key-modal.css';
import './styles/profile-library-modal.css';
import './styles/plan-modal.css';
import './styles/poster-modal.css';
import './styles/wall.css';

import { ApiKeyModal } from './components/ApiKeyModal.js';
import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { ParticleCanvas } from './components/ParticleCanvas.js';
import { PlanModal } from './components/PlanModal.js';
import { PosterModal } from './components/PosterModal.js';
import { ProfileLibraryModal } from './components/ProfileLibraryModal.js';
import { ToastContainer, type ToastMessage } from './components/ToastContainer.js';
import { WishHero } from './components/WishHero.js';
import { WishWall, type WishWallRef } from './components/WishWall.js';
import { LanguageProvider, useLanguage } from './context/LanguageContext.js';
import { loadPersonalProfile, savePersonalProfile } from './profile-storage.js';
import type { Wish } from './types.js';

const MainContent: React.FC = () => {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [customApiKey, setCustomApiKey] = useState<string>(
    () => localStorage.getItem('gemini_api_key') || ''
  );
  const [modelTier, setModelTier] = useState<string>(() => {
    const v = localStorage.getItem('gemini_model_tier');
    return v === 'FLASH' || v === 'PRO' || v === 'LITE' ? v : 'LITE';
  });
  const [thinkingLevel, setThinkingLevel] = useState<string>(() => {
    const v = localStorage.getItem('gemini_thinking_level');
    return v === 'LOW' || v === 'MEDIUM' || v === 'HIGH' ? v : 'MEDIUM';
  });
  const [personalProfile, setPersonalProfile] = useState<string[]>(loadPersonalProfile);

  // Modals state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isProfileLibraryModalOpen, setIsProfileLibraryModalOpen] = useState(false);

  const [planModalState, setPlanModalState] = useState<{
    isOpen: boolean;
    wish: Wish | null;
    isDraft: boolean;
  }>({
    isOpen: false,
    wish: null,
    isDraft: false,
  });

  const [posterModalState, setPosterModalState] = useState<{
    isOpen: boolean;
    blob: Blob | null;
    filename: string;
  }>({
    isOpen: false,
    blob: null,
    filename: '',
  });
  const [posterVersion, setPosterVersion] = useState(0);

  const wishWallRef = useRef<WishWallRef>(null);
  const toastTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      timers.forEach(timer => {
        clearTimeout(timer);
      });
      timers.clear();
    };
  }, []);

  const showToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message }]);
    const timer = setTimeout(() => {
      toastTimersRef.current.delete(timer);
      setToasts(prev => prev.filter(item => item.id !== id));
    }, 3100);
    toastTimersRef.current.add(timer);
  }, []);

  const handleSaveApiKey = (key: string, tier: string, level: string) => {
    setCustomApiKey(key);
    const normalizedTier = tier === 'FLASH' || tier === 'PRO' ? tier : 'LITE';
    setModelTier(normalizedTier);
    const normalizedLevel = level === 'LOW' || level === 'HIGH' ? level : 'MEDIUM';
    setThinkingLevel(normalizedLevel);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    localStorage.setItem('gemini_model_tier', normalizedTier);
    localStorage.setItem('gemini_thinking_level', normalizedLevel);
    showToast(t(key ? 'apiKeySaved' : 'apiKeyCleared'));
  };

  const handleWishCreated = (wish: Wish) => {
    setPlanModalState({
      isOpen: true,
      wish,
      isDraft: true,
    });
  };

  const handleSavePersonalProfile = (entries: string[]) => {
    const savedEntries = savePersonalProfile(entries);
    setPersonalProfile(savedEntries);
    showToast(t(savedEntries.length > 0 ? 'profileSaved' : 'profileCleared'));
  };

  const handleOpenPlanModal = (wish: Wish) => {
    setPlanModalState({
      isOpen: true,
      wish,
      isDraft: false,
    });
  };

  const handleOpenPosterModal = (blob: Blob, filename: string) => {
    setPosterVersion(version => version + 1);
    setPosterModalState({
      isOpen: true,
      blob,
      filename,
    });
  };

  const handleSavedPlan = () => {
    wishWallRef.current?.refresh();
  };

  const handleClosePosterModal = () => {
    setPosterModalState({ isOpen: false, blob: null, filename: '' });
  };

  return (
    <>
      <ParticleCanvas />

      <Header
        onOpenProfileLibraryModal={() => setIsProfileLibraryModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      <main className="main-content">
        <WishHero
          customApiKey={customApiKey}
          modelTier={modelTier}
          thinkingLevel={thinkingLevel}
          personalProfile={personalProfile}
          onWishCreated={handleWishCreated}
          onShowToast={showToast}
        />

        <WishWall
          ref={wishWallRef}
          onOpenPlanModal={handleOpenPlanModal}
          onOpenPosterModal={handleOpenPosterModal}
          onShowToast={showToast}
        />
      </main>

      <Footer />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        apiKey={customApiKey}
        modelTier={modelTier}
        thinkingLevel={thinkingLevel}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaveApiKey={handleSaveApiKey}
      />

      <ProfileLibraryModal
        isOpen={isProfileLibraryModalOpen}
        entries={personalProfile}
        onClose={() => setIsProfileLibraryModalOpen(false)}
        onSave={handleSavePersonalProfile}
      />

      <PlanModal
        isOpen={planModalState.isOpen}
        wish={planModalState.wish}
        isDraft={planModalState.isDraft}
        onClose={() => setPlanModalState(prev => ({ ...prev, isOpen: false }))}
        onSaved={handleSavedPlan}
        onShowToast={showToast}
      />

      <PosterModal
        key={posterVersion}
        isOpen={posterModalState.isOpen}
        blob={posterModalState.blob}
        filename={posterModalState.filename}
        onClose={handleClosePosterModal}
        onShowToast={showToast}
      />

      <ToastContainer toasts={toasts} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainContent />
    </LanguageProvider>
  );
};
