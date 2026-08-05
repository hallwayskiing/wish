import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p><span aria-hidden="true">✦</span> {t('brand')}</p>
        <p className="footer-sub">{t('footerQuote')}</p>
      </div>
    </footer>
  );
};
