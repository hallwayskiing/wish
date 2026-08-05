import React, { useState, useEffect, useRef } from 'react';
import { CATEGORY_IDS, CategoryId, getCategoryLabel } from '../../categories.js';
import { WishAPI } from '../api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Wish } from '../types.js';

interface WishHeroProps {
  customApiKey: string;
  onWishCreated: (wish: Wish) => void;
  onShowToast: (msg: string) => void;
}

export const WishHero: React.FC<WishHeroProps> = ({ customApiKey, onWishCreated, onShowToast }) => {
  const { language, t, dict } = useLanguage();
  const [category, setCategory] = useState<CategoryId>('growth');
  const [wishText, setWishText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultExample = dict.placeholders[category] || '';
  const placeholder = `${defaultExample}...`;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isLoading) {
      let pct = 5;

      interval = setInterval(() => {
        if (pct < 90) {
          pct = Math.min(90, pct + Math.floor(Math.random() * 8) + 3);
          setProgress(pct);
          const nextIdx = Math.min(dict.loadingPhrases.length - 1, Math.floor(pct / 25));
          setLoadingPhraseIndex(nextIdx);
        }
      }, 300);
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isLoading, dict.loadingPhrases]);

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
    const textToSubmit = wishText.trim() || defaultExample;
    setProgress(5);
    setLoadingPhraseIndex(0);
    setIsLoading(true);

    try {
      const res = await WishAPI.submitWish(textToSubmit, category, customApiKey, language);
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
        <div className="hero-badge">
          <span>{t('heroBadge')}</span>
        </div>
        <h1 className="hero-title">
          <span>{t('heroTitle')}</span>
          <span className="gradient-text">{t('heroTitleAccent')}</span>
        </h1>
        <p className="hero-subtitle">{t('heroSubtitle')}</p>

        <form className="wish-card-form glass-panel" onSubmit={handleSubmit} aria-busy={isLoading}>
          <div className="category-selector" role="group" aria-labelledby="categoryLabel">
            <span className="section-label" id="categoryLabel">{t('categoryLabel')}</span>
            <div className="category-pills" id="categoryPills">
              {CATEGORY_IDS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-pill ${category === cat ? 'active' : ''}`}
                  aria-pressed={category === cat}
                  onClick={() => setCategory(cat)}
                >
                  {getCategoryLabel(cat, language)}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <textarea
              id="wishInput"
              rows={3}
              maxLength={300}
              placeholder={placeholder}
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
            disabled={isLoading}
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
