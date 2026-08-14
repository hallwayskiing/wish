import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { WishAPI } from '../api.js';
import { useLanguage } from '../context/LanguageContext.js';
import type { Wish } from '../types.js';

interface WishHeroProps {
  customApiKey: string;
  modelTier: string;
  personalProfile: string[];
  onWishCreated: (wish: Wish) => void;
  onShowToast: (msg: string) => void;
}

export const WishHero: React.FC<WishHeroProps> = ({
  customApiKey,
  modelTier,
  personalProfile,
  onWishCreated,
  onShowToast,
}) => {
  const { language, t, dict } = useLanguage();
  const [wishText, setWishText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return Math.min(90, prev + Math.floor(Math.random() * 8) + 3);
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    const nextIdx = Math.min(
      dict.loadingPhrases.length - 1,
      Math.floor((progress / 100) * dict.loadingPhrases.length)
    );
    setLoadingPhraseIndex(nextIdx);
  }, [progress, dict.loadingPhrases, isLoading]);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current !== null) {
        clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    const textToSubmit = wishText.trim();
    if (!textToSubmit) {
      onShowToast(`❌ ${t('generationError')}`);
      return;
    }
    setProgress(5);
    setLoadingPhraseIndex(0);
    setIsLoading(true);

    try {
      const res = await WishAPI.submitWish(
        textToSubmit,
        customApiKey,
        language,
        modelTier,
        personalProfile
      );
      setProgress(100);
      completionTimerRef.current = setTimeout(() => {
        completionTimerRef.current = null;
        setIsLoading(false);
        setWishText('');
        onWishCreated(res.wish);
      }, 450);
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : '';
      onShowToast(`❌ ${message || t('generationError')}`);
    }
  };

  return (
    <section className="wish-hero" id="wish-hero">
      <div className="hero-content">
        <h1 className="hero-title">
          <span>{t('heroTitle')}</span>
          <span className="gradient-text">{t('heroTitleAccent')}</span>
        </h1>
        <p className="hero-subtitle">{t('heroSubtitle')}</p>

        <form className="wish-card-form glass-panel" onSubmit={handleSubmit} aria-busy={isLoading}>
          <div className="input-group">
            <textarea
              id="wishInput"
              rows={3}
              maxLength={300}
              placeholder={t('wishInputLabel')}
              aria-label={t('wishInputLabel')}
              value={wishText}
              onChange={e => setWishText(e.target.value)}
            />
            <div className="input-footer">
              <span className="char-count" id="charCount">
                {wishText.length}/300
              </span>
            </div>
          </div>

          <button
            id="submitWishBtn"
            className="btn-primary"
            disabled={isLoading || !wishText.trim()}
            type="submit"
          >
            <span className="btn-stars">✦</span>
            <span className="btn-text">{t('submitWish')}</span>
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="ai-loading-overlay show" id="loadingOverlay">
          <div className="loading-box glass-panel">
            <div className="cosmic-spinner">
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="ring ring-3" />
              <div className="core-star">✦</div>
            </div>
            <h3 className="loading-title">{t('loadingTitle')}</h3>
            <p className="loading-status" id="loadingStatusText">
              {progress === 100 ? t('generationComplete') : dict.loadingPhrases[loadingPhraseIndex]}
            </p>
            <div className="loading-progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
