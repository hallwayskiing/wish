import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';

interface HeaderProps {
  onOpenProfileLibraryModal: () => void;
  onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfileLibraryModal, onOpenApiKeyModal }) => {
  const { t, toggleLanguage } = useLanguage();
  const [activeNav, setActiveNav] = React.useState<'hero' | 'wall'>('hero');

  React.useEffect(() => {
    const wallSection = document.getElementById('wish-wall');
    if (!wallSection) return;

    let scrollFrame: number | null = null;
    const updateActiveNav = () => {
      scrollFrame = null;
      const readingLine = Math.min(window.innerHeight * 0.4, 300);
      setActiveNav(wallSection.getBoundingClientRect().top <= readingLine ? 'wall' : 'hero');
    };
    const scheduleUpdate = () => {
      if (scrollFrame === null) {
        scrollFrame = requestAnimationFrame(updateActiveNav);
      }
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (scrollFrame !== null) {
        cancelAnimationFrame(scrollFrame);
      }
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <span className="logo-icon" aria-hidden="true">
            ✦
          </span>
          <span className="logo-text">{t('brand')}</span>
        </div>
        <nav className="nav-links" aria-label={t('primaryNavLabel')}>
          <a
            href="#wish-hero"
            className={`nav-item ${activeNav === 'hero' ? 'active' : ''}`}
            id="nav-wish"
            aria-current={activeNav === 'hero' ? 'location' : undefined}
          >
            {t('navWish')}
          </a>
          <a
            href="#wish-wall"
            className={`nav-item ${activeNav === 'wall' ? 'active' : ''}`}
            id="nav-wall"
            aria-current={activeNav === 'wall' ? 'location' : undefined}
          >
            {t('navWall')}
          </a>
          <button
            className="api-key-btn"
            id="openProfileLibraryModalBtn"
            title={t('profileLibraryTitle')}
            aria-label={t('profileLibraryShort')}
            onClick={onOpenProfileLibraryModal}
            type="button"
          >
            <span className="key-icon" aria-hidden="true">
              📚
            </span>{' '}
            <span className="header-action-label">{t('profileLibraryShort')}</span>
          </button>
          <button
            className="api-key-btn"
            id="openApiKeyModalBtn"
            title={t('apiConfigTitle')}
            aria-label={t('apiConfigShort')}
            onClick={onOpenApiKeyModal}
            type="button"
          >
            <span className="key-icon" aria-hidden="true">
              ⚙️
            </span>{' '}
            <span className="header-action-label">{t('apiConfigShort')}</span>
          </button>
          <button
            className="api-key-btn language-toggle-btn"
            id="languageToggleBtn"
            type="button"
            title={t('languageToggleTitle')}
            onClick={toggleLanguage}
          >
            {t('languageToggleLabel')}
          </button>
        </nav>
      </div>
    </header>
  );
};
