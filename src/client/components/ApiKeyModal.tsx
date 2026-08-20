import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';

interface ApiKeyModalProps {
  isOpen: boolean;
  apiKey: string;
  modelTier: string;
  thinkingLevel: string;
  onClose: () => void;
  onSaveApiKey: (key: string, tier: string, thinkingLevel: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  apiKey,
  modelTier,
  thinkingLevel,
  onClose,
  onSaveApiKey,
}) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tier, setTier] = useState<string>(modelTier);
  const [level, setLevel] = useState<string>(thinkingLevel);
  const dialogRef = useDialogA11y(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    if (inputRef.current) {
      inputRef.current.value = apiKey;
    }
    setTier(modelTier);
    setLevel(thinkingLevel);
  }, [apiKey, modelTier, thinkingLevel, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(inputRef.current?.value.trim() || '', tier, level);
    onClose();
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onSaveApiKey('', tier, level);
    onClose();
  };

  return (
    <div className="modal-backdrop show" id="apiKeyModal">
      <button
        type="button"
        className="modal-overlay"
        aria-label={t('closeModal')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="modal-dialog glass-panel small-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apiKeyModalTitle"
        tabIndex={-1}
      >
        <button
          className="close-modal-btn"
          id="closeApiKeyModalBtn"
          onClick={onClose}
          type="button"
          data-dialog-close
          aria-label={t('close')}
        >
          ✕
        </button>
        <div className="modal-header">
          <h3 id="apiKeyModalTitle">
            <span aria-hidden="true">⚙️</span> {t('apiConfigTitle')}
          </h3>
        </div>
        <div className="modal-body">
          <p className="api-modal-tip">{t('apiModalTip')}</p>
          <div className="form-group">
            <label htmlFor="apiKeyInput">{t('apiKeyLabel')}</label>
            <input
              type="password"
              id="apiKeyInput"
              placeholder="AIzaSy..."
              autoComplete="off"
              defaultValue={apiKey}
              ref={inputRef}
            />
          </div>
          <fieldset className="category-selector model-tier-fieldset">
            <legend className="section-label">{t('modelLabel')}</legend>
            <div className="model-tier-grid" role="radiogroup" aria-label={t('modelLabel')}>
              <label className="model-tier-card">
                <input
                  type="radio"
                  name="modelTier"
                  value="LITE"
                  checked={tier === 'LITE'}
                  onChange={() => setTier('LITE')}
                />
                <span className="model-tier-icon" aria-hidden="true">
                  ✦
                </span>
                <span className="model-tier-meta">
                  <span className="model-tier-name">LITE</span>
                  <span className="model-tier-desc">
                    {t('modelTierLite').replace('LITE · ', '')}
                  </span>
                  <span className="model-tier-model">gemini-flash-lite-latest</span>
                </span>
              </label>
              <label className="model-tier-card">
                <input
                  type="radio"
                  name="modelTier"
                  value="FLASH"
                  checked={tier === 'FLASH'}
                  onChange={() => setTier('FLASH')}
                />
                <span className="model-tier-icon" aria-hidden="true">
                  ⚡
                </span>
                <span className="model-tier-meta">
                  <span className="model-tier-name">FLASH</span>
                  <span className="model-tier-desc">
                    {t('modelTierFlash').replace('FLASH · ', '')}
                  </span>
                  <span className="model-tier-model">gemini-flash-latest</span>
                </span>
              </label>
              <label className="model-tier-card">
                <input
                  type="radio"
                  name="modelTier"
                  value="PRO"
                  checked={tier === 'PRO'}
                  onChange={() => setTier('PRO')}
                />
                <span className="model-tier-icon" aria-hidden="true">
                  ◆
                </span>
                <span className="model-tier-meta">
                  <span className="model-tier-name">PRO</span>
                  <span className="model-tier-desc">{t('modelTierPro').replace('PRO · ', '')}</span>
                  <span className="model-tier-model">gemini-pro-latest</span>
                </span>
              </label>
            </div>
          </fieldset>
          <fieldset className="category-selector model-tier-fieldset thinking-level-fieldset">
            <legend className="section-label">{t('thinkingLevelLabel')}</legend>
            <div className="model-tier-grid" role="radiogroup" aria-label={t('thinkingLevelLabel')}>
              <label className="model-tier-card">
                <input
                  type="radio"
                  name="thinkingLevel"
                  value="LOW"
                  checked={level === 'LOW'}
                  onChange={() => setLevel('LOW')}
                />
                <span className="model-tier-icon" aria-hidden="true">
                  ✧
                </span>
                <span className="model-tier-meta">
                  <span className="model-tier-name">LOW</span>
                  <span className="model-tier-desc">
                    {t('thinkingLevelLow').replace('LOW · ', '')}
                  </span>
                </span>
              </label>
              <label className="model-tier-card">
                <input
                  type="radio"
                  name="thinkingLevel"
                  value="MEDIUM"
                  checked={level === 'MEDIUM'}
                  onChange={() => setLevel('MEDIUM')}
                />
                <span className="model-tier-icon" aria-hidden="true">
                  ✦
                </span>
                <span className="model-tier-meta">
                  <span className="model-tier-name">MEDIUM</span>
                  <span className="model-tier-desc">
                    {t('thinkingLevelMedium').replace('MEDIUM · ', '')}
                  </span>
                </span>
              </label>
              <label className="model-tier-card">
                <input
                  type="radio"
                  name="thinkingLevel"
                  value="HIGH"
                  checked={level === 'HIGH'}
                  onChange={() => setLevel('HIGH')}
                />
                <span className="model-tier-icon" aria-hidden="true">
                  ★
                </span>
                <span className="model-tier-meta">
                  <span className="model-tier-name">HIGH</span>
                  <span className="model-tier-desc">
                    {t('thinkingLevelHigh').replace('HIGH · ', '')}
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" id="clearApiKeyBtn" onClick={handleClear} type="button">
            {t('clearApiKey')}
          </button>
          <button className="btn-primary" id="saveApiKeyBtn" onClick={handleSave} type="button">
            {t('saveConfig')}
          </button>
        </div>
      </div>
    </div>
  );
};
