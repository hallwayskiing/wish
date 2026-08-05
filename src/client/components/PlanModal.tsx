import React, { useState } from 'react';
import { getCategoryName } from '../../categories.js';
import { WishAPI } from '../api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';
import { AIPlanPhase, Wish } from '../types.js';

interface PlanModalProps {
  isOpen: boolean;
  wish: Wish | null;
  isDraft?: boolean;
  onClose: () => void;
  onSaved: () => void;
  onShowToast: (msg: string) => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  wish,
  isDraft = false,
  onClose,
  onSaved,
  onShowToast
}) => {
  const { language, t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const dialogRef = useDialogA11y(isOpen, onClose);

  if (!isOpen || !wish) return null;

  const plan = wish.aiPlan || {};
  const categoryName = getCategoryName(wish.category, language, t('beautifulWish'));

  const dateStr = new Date(wish.createdAt).toLocaleString(
    language === 'en' ? 'en-US' : 'zh-CN',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );

  const rawSteps: AIPlanPhase[] = plan.roadmap || plan.phases || [];
  const habitsList = plan.habitsAndTools || plan.habits || [];
  const pitfallsList = plan.pitfalls || [];

  const handleSave = async () => {
    if (isSaving || !wish) return;
    setIsSaving(true);
    try {
      await WishAPI.saveWish(wish, language);
      onShowToast(t('wishSaved'));
      onSaved();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      onShowToast(`⚠️ ${message || t('saveError')}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (isCompleting || !wish) return;
    setIsCompleting(true);
    try {
      await WishAPI.completeWish(wish.id);
      onShowToast(t('wishCompleted'));
      onSaved();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      onShowToast(`⚠️ ${message || t('completeError')}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const getPhaseHeading = (step: AIPlanPhase, idx: number) => {
    const label = `${t('phaseLabel')} ${idx + 1}`;
    const phaseName = typeof step.phase === 'string' ? step.phase.trim() : '';
    return phaseName ? `${label} · ${phaseName}` : label;
  };

  return (
    <div className="modal-backdrop show" id="planModal" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-dialog large-modal glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalWishTitle"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="close-modal-btn"
          id="closePlanModalBtn"
          onClick={onClose}
          type="button"
          data-dialog-close
          aria-label={t('closeModal')}
        >
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-badge" id="modalCategoryBadge">
            {categoryName}
          </div>
          <h2 className="modal-wish-title" id="modalWishTitle">
            “{wish.title}”
          </h2>
          <div className="modal-meta">
            <span className="meta-time" id="modalWishTime">
              {t('wishTime')}: {dateStr}
            </span>
          </div>
        </div>

        <div className="modal-body" id="modalWishContent">
          <div className="inspiration-card">
            <div className="card-icon">✦</div>
            <div className="card-content">
              <h4>{t('inspirationTitle')}</h4>
              <p id="planInspiration">“{plan.inspiration || t('inspirationFallback')}”</p>
            </div>
          </div>

          <div className="plan-section">
            <h3 className="section-title">{t('roadmapTitle')}</h3>
            <div className="roadmap-timeline" id="planRoadmap">
              {rawSteps.map((step, idx) => (
                <div key={idx} className="roadmap-step-card">
                  <div className="step-header">
                    <span className="step-phase">{getPhaseHeading(step, idx)}</span>
                    <span className="step-timeline">
                      ⏱️ {step.timeline || t('timelineFallback')}
                    </span>
                  </div>
                  <div className="step-title">
                    {step.title || step.name || t('taskFallback')}
                  </div>
                  <div className="step-action">
                    {step.action || (Array.isArray(step.tasks) ? step.tasks.join('; ') : '')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="plan-grid-2">
            <div className="plan-box box-habits">
              <h4>{t('habitsTitle')}</h4>
              <ul id="planHabits">
                {habitsList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="plan-box box-pitfalls">
              <h4>{t('pitfallsTitle')}</h4>
              <ul id="planPitfalls">
                {pitfallsList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="first-step-box">
            <div className="step-badge">{t('firstStepTitle')}</div>
            <div className="step-text" id="planFirstStep">
              {plan.firstStep || t('firstStepFallback')}
            </div>
          </div>
        </div>

        <div className="modal-footer" id="planModalFooter">
          <button
            className="btn-secondary"
            id="closeDraftBtn"
            onClick={onClose}
            type="button"
          >
            {t('close')}
          </button>
          {isDraft ? (
            <button
              className="btn-primary"
              id="saveWishBtn"
              onClick={handleSave}
              disabled={isSaving}
              type="button"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          ) : (
            <button
              className="btn-primary"
              id="completeWishBtn"
              onClick={handleComplete}
              disabled={isCompleting || wish.status === 'completed'}
              type="button"
            >
              {isCompleting
                ? t('completingWish')
                : wish.status === 'completed'
                ? t('alreadyCompleted')
                : t('completeWish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
