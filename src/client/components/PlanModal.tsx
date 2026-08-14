import type React from 'react';
import { useState } from 'react';
import { getCategoryName } from '../../categories.js';
import { WishAPI } from '../api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';
import type { AIPlanPhase, Wish } from '../types.js';

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
  onShowToast,
}) => {
  const { language, t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const dialogRef = useDialogA11y(isOpen, onClose);

  if (!isOpen || !wish) return null;

  const plan = wish.aiPlan || {};
  const categoryName =
    wish.categories.map(c => getCategoryName(c, language, t('beautifulWish'))).join(' · ') ||
    t('beautifulWish');

  const dateStr = new Date(wish.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rawSteps: AIPlanPhase[] = plan.roadmap || plan.phases || [];
  const habitsList = plan.habitsAndSystems || [];
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
    <div className="modal-backdrop show" id="planModal">
      <button
        type="button"
        className="modal-overlay"
        aria-label={t('closeModal')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="modal-dialog large-modal glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalWishTitle"
        tabIndex={-1}
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
          <div className="modal-header-top">
            <div className="modal-badge" id="modalCategoryBadge">
              {categoryName}
            </div>
            <span className="meta-time" id="modalWishTime">
              {t('wishTime')}: {dateStr}
            </span>
          </div>
          <h2 className="modal-wish-title" id="modalWishTitle">
            “{wish.title}”
          </h2>
        </div>

        <div className="modal-body" id="modalWishContent">
          <div className="modal-summary" id="modalWishSummary">
            <div className="modal-summary-label">
              <span aria-hidden="true">🍃</span> {t('summaryLabel')}
            </div>
            <p className="modal-summary-text" lang={language}>
              “{plan.summary?.trim() || t('summaryFallback')}”
            </p>
          </div>

          <div className="inspiration-card">
            <div className="card-content">
              <h4>
                <span className="card-icon" aria-hidden="true">
                  ✨
                </span>
                {t('inspirationTitle')}
              </h4>
              <p id="planInspiration">“{plan.inspiration || t('inspirationFallback')}”</p>
            </div>
          </div>

          <div className="plan-section">
            <h3 className="section-title">{t('roadmapTitle')}</h3>
            <div className="roadmap-timeline" id="planRoadmap">
              {rawSteps.map((step, idx) => (
                <div
                  key={`${idx}-${step.phase}-${step.title ?? step.name}`}
                  className="roadmap-step-card"
                >
                  <div className="step-header">
                    <span className="step-phase">{getPhaseHeading(step, idx)}</span>
                    <span className="step-timeline">
                      ⏱️ {step.timeline || t('timelineFallback')}
                    </span>
                  </div>
                  <div className="step-title">{step.title || step.name || t('taskFallback')}</div>
                  <div className="step-action">
                    {step.action || (Array.isArray(step.tasks) ? step.tasks.join('; ') : '')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="plan-list-sections">
            <section className="plan-list-section box-habits">
              <h4>{t('habitsTitle')}</h4>
              <ul id="planHabits">
                {habitsList.map((item, idx) => (
                  <li key={`${idx}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="plan-list-section box-pitfalls">
              <h4>{t('pitfallsTitle')}</h4>
              <ul id="planPitfalls">
                {pitfallsList.map((item, idx) => (
                  <li key={`${idx}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="first-step-box">
            <div className="step-badge">{t('firstStepTitle')}</div>
            <div className="step-text" id="planFirstStep">
              {plan.firstStep || t('firstStepFallback')}
            </div>
          </div>
        </div>

        <div className="modal-footer" id="planModalFooter">
          <button className="btn-secondary" id="closeDraftBtn" onClick={onClose} type="button">
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
