import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';

interface ApiKeyModalProps {
  isOpen: boolean;
  apiKey: string;
  onClose: () => void;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  apiKey,
  onClose,
  onSaveApiKey
}) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useDialogA11y(isOpen, onClose);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = apiKey;
    }
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(inputRef.current?.value.trim() || '');
    onClose();
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onSaveApiKey('');
    onClose();
  };

  return (
    <div className="modal-backdrop show" id="apiKeyModal" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-dialog glass-panel small-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apiKeyModalTitle"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
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
          <h3 id="apiKeyModalTitle"><span aria-hidden="true">⚙️</span> {t('apiConfigTitle')}</h3>
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
