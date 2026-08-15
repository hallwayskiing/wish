import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  MAX_PROFILE_ENTRIES,
  MAX_PROFILE_ENTRY_LENGTH,
  normalizePersonalProfile,
} from '../../profile-library.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useDialogA11y } from '../hooks/useDialogA11y.js';

interface ProfileLibraryModalProps {
  isOpen: boolean;
  entries: string[];
  onClose: () => void;
  onSave: (entries: string[]) => void;
}

export const ProfileLibraryModal: React.FC<ProfileLibraryModalProps> = ({
  isOpen,
  entries,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [draftEntries, setDraftEntries] = useState<Array<{ id: string; text: string }>>(() =>
    entries.map(text => ({ id: crypto.randomUUID(), text }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dialogRef = useDialogA11y(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setDraftEntries(entries.map(text => ({ id: crypto.randomUUID(), text })));
      setEditingId(null);
    }
  }, [entries, isOpen]);

  useEffect(() => {
    if (!isOpen || editingId === null) return undefined;
    const focusFrame = requestAnimationFrame(() => {
      const textarea = editingTextareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
    return () => cancelAnimationFrame(focusFrame);
  }, [editingId, isOpen]);

  if (!isOpen) return null;

  const handleEntryChange = (id: string, value: string) => {
    setDraftEntries(current =>
      current.map(entry => (entry.id === id ? { ...entry, text: value } : entry))
    );
  };

  const handleRemoveEntry = (id: string) => {
    setDraftEntries(current => current.filter(entry => entry.id !== id));
    setEditingId(current => (current === id ? null : current));
  };

  const handleAddEntry = () => {
    if (draftEntries.length >= MAX_PROFILE_ENTRIES) return;
    const id = crypto.randomUUID();
    setDraftEntries(current => [...current, { id, text: '' }]);
    setEditingId(id);
  };

  const handleSave = () => {
    onSave(normalizePersonalProfile(draftEntries.map(entry => entry.text)));
    onClose();
  };

  return (
    <div className="modal-backdrop show" id="profileLibraryModal">
      <button
        type="button"
        className="modal-overlay"
        aria-label={t('closeModal')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="modal-dialog glass-panel profile-library-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profileLibraryModalTitle"
        tabIndex={-1}
      >
        <button
          className="close-modal-btn"
          onClick={onClose}
          type="button"
          data-dialog-close
          aria-label={t('close')}
        >
          ✕
        </button>
        <div className="modal-header">
          <h3 id="profileLibraryModalTitle">
            <span aria-hidden="true">📚</span> {t('profileLibraryTitle')}
          </h3>
        </div>
        <div className="modal-body">
          <p className="profile-library-tip">{t('profileLibraryTip')}</p>
          <div className="profile-entry-list">
            {draftEntries.map((item, index) => {
              const isEditing = editingId === item.id;
              return (
                <div className={`profile-entry ${isEditing ? 'editing' : 'compact'}`} key={item.id}>
                  {isEditing ? (
                    <>
                      <div className="profile-entry-heading">
                        <label htmlFor={`profileEntry-${item.id}`}>
                          {t('profileEntryLabel')} {index + 1}
                        </label>
                        <button
                          className="profile-entry-action remove"
                          type="button"
                          onClick={() => handleRemoveEntry(item.id)}
                          aria-label={`${t('removeProfileEntry')} ${index + 1}`}
                          title={t('removeProfileEntry')}
                        >
                          {t('removeProfileEntry')}
                        </button>
                      </div>
                      <textarea
                        id={`profileEntry-${item.id}`}
                        rows={2}
                        ref={editingTextareaRef}
                        maxLength={MAX_PROFILE_ENTRY_LENGTH}
                        placeholder={t('profileEntryPlaceholder')}
                        value={item.text}
                        onChange={event => handleEntryChange(item.id, event.target.value)}
                        onBlur={event => {
                          const profileEntry = event.currentTarget.closest('.profile-entry');
                          const nextFocus = event.relatedTarget;
                          if (nextFocus instanceof Node && profileEntry?.contains(nextFocus))
                            return;
                          if (!event.currentTarget.value.trim()) {
                            handleRemoveEntry(item.id);
                          } else {
                            setEditingId(current => (current === item.id ? null : current));
                          }
                        }}
                      />
                      <span className="profile-entry-count">
                        {item.text.length}/{MAX_PROFILE_ENTRY_LENGTH}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="profile-entry-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <button
                        className="profile-entry-summary"
                        type="button"
                        onClick={() => setEditingId(item.id)}
                        title={item.text}
                      >
                        {item.text}
                      </button>
                      <div className="profile-entry-actions">
                        <button
                          className="profile-entry-action remove"
                          type="button"
                          onClick={() => handleRemoveEntry(item.id)}
                          aria-label={`${t('removeProfileEntry')} ${index + 1}`}
                        >
                          {t('removeProfileEntry')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <button
            className="profile-entry-add"
            type="button"
            onClick={handleAddEntry}
            disabled={draftEntries.length >= MAX_PROFILE_ENTRIES}
          >
            <span aria-hidden="true">＋</span> {t('addProfileEntry')}
          </button>
          <p className="profile-entry-limit">
            {t('profileEntryLimit')} {draftEntries.length}/{MAX_PROFILE_ENTRIES}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} type="button">
            {t('cancel')}
          </button>
          <button
            className="btn-primary"
            onPointerDown={event => event.preventDefault()}
            onClick={handleSave}
            type="button"
          >
            {t('saveProfile')}
          </button>
        </div>
      </div>
    </div>
  );
};
