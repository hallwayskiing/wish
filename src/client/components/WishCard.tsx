import type React from 'react';
import { useState } from 'react';
import { getCategoryName } from '../../categories.js';
import { WishAPI } from '../api.js';
import { useLanguage } from '../context/LanguageContext.js';
import type { Wish } from '../types.js';

let posterModulePromise: Promise<{
  createWishPoster: typeof import('../poster.js').createWishPoster;
}> | null = null;

function loadPosterModule() {
  posterModulePromise ||= import('../poster.js').catch(error => {
    posterModulePromise = null;
    throw error;
  });
  return posterModulePromise;
}

interface WishCardProps {
  wish: Wish;
  onOpenPlanModal: (wish: Wish) => void;
  onOpenPosterModal: (blob: Blob, filename: string) => void;
  onShowToast: (msg: string) => void;
  onBlessed: (wishId: string, blessings: number) => void;
}

export const WishCard: React.FC<WishCardProps> = ({
  wish,
  onOpenPlanModal,
  onOpenPosterModal,
  onShowToast,
  onBlessed,
}) => {
  const { language, t } = useLanguage();
  const [isBlessing, setIsBlessing] = useState(false);
  const [hasBlessed, setHasBlessed] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  const date = new Date(wish.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
  const inspiration = wish.aiPlan?.inspiration || t('inspirationFallback');
  const categoryName = getCategoryName(wish.category, language, t('wishFallback'));

  const handleBless = async () => {
    if (isBlessing) return;
    setIsBlessing(true);
    try {
      const result = await WishAPI.blessWish(wish.id);
      onBlessed(wish.id, result.blessings);
      setHasBlessed(true);
      onShowToast(t('blessSuccess'));
    } catch {
      onShowToast(t('blessError'));
    } finally {
      setIsBlessing(false);
    }
  };

  const handleSharePoster = async () => {
    if (isGeneratingPoster) return;
    setIsGeneratingPoster(true);
    try {
      const { createWishPoster } = await loadPosterModule();
      const poster = await createWishPoster(wish, { language, t });
      onOpenPosterModal(poster.blob, poster.filename);
    } catch (error) {
      console.error('Poster generation failed:', error);
      onShowToast(t('posterError'));
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  return (
    <div
      className={`wish-card glass-panel ${wish.status === 'completed' ? 'wish-completed-card' : ''}`}
    >
      <div>
        <div className="card-top">
          <span className="card-cat-badge">{categoryName}</span>
          {wish.status === 'completed' && (
            <span className="card-completed-badge">🎉 {t('completedBadge')}</span>
          )}
          <span className="card-date">{date}</span>
        </div>
        <h3 className="card-wish-text">“{wish.title}”</h3>
        <div className="card-ai-preview">
          <div className="preview-label">
            <span aria-hidden="true">✨</span> {t('inspirationTitle')}
          </div>
          <div className="preview-text">{inspiration}</div>
        </div>
      </div>
      <div className="card-bottom">
        <button
          className={`btn-bless ${isBlessing ? 'loading' : ''} ${hasBlessed ? 'blessed' : ''}`}
          onClick={handleBless}
          disabled={isBlessing}
          type="button"
        >
          <span className="bless-icon" aria-hidden="true">
            {isBlessing ? '↻' : '✨'}
          </span>
          <span className="bless-label">{t('bless')}</span>
          <span className="bless-count">{wish.blessings || 0}</span>
        </button>
        <button
          className="btn-share"
          onClick={handleSharePoster}
          disabled={isGeneratingPoster}
          type="button"
        >
          <span className="share-icon" aria-hidden="true">
            ↗
          </span>
          <span>{t('sharePoster')}</span>
        </button>
        <button className="btn-view-plan" onClick={() => onOpenPlanModal(wish)} type="button">
          {t('viewPlan')}
        </button>
      </div>
    </div>
  );
};
