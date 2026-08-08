import type React from 'react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';

interface PosterModalProps {
  isOpen: boolean;
  blob: Blob | null;
  filename: string;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const PosterModal: React.FC<PosterModalProps> = ({
  isOpen,
  blob,
  filename,
  onClose,
  onShowToast,
}) => {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string>('');
  const dialogRef = useDialogA11y(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || !blob) {
      return undefined;
    }
    const url = URL.createObjectURL(blob);
    let isActive = true;
    const frame = requestAnimationFrame(() => {
      if (isActive) {
        setImageUrl(url);
      }
    });
    return () => {
      isActive = false;
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [blob, isOpen]);

  if (!isOpen || !blob) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'wish-poster.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    onShowToast(t('posterDownloaded'));
  };

  return (
    <div className="modal-backdrop show" id="posterModal">
      <button
        type="button"
        className="modal-overlay"
        aria-label={t('closeModal')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="modal-dialog poster-modal-dialog glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="posterModalTitle"
        tabIndex={-1}
      >
        <button
          className="close-modal-btn"
          id="closePosterModalBtn"
          onClick={onClose}
          type="button"
          data-dialog-close
          aria-label={t('closeModal')}
        >
          ✕
        </button>
        <div className="poster-modal-header">
          <h2 id="posterModalTitle">{t('posterPreviewTitle')}</h2>
          <p>{t('posterPreviewHint')}</p>
        </div>

        <div className="poster-preview-body">
          {imageUrl && <img id="posterPreviewImage" src={imageUrl} alt={t('posterPreviewAlt')} />}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" id="cancelPosterBtn" onClick={onClose} type="button">
            {t('close')}
          </button>
          <button
            className="btn-primary"
            id="downloadPosterBtn"
            onClick={handleDownload}
            type="button"
          >
            {t('downloadPoster')}
          </button>
        </div>
      </div>
    </div>
  );
};
