import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CATEGORY_IDS, getCategoryLabel } from '../../categories.js';
import { WishAPI } from '../api.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useDebounce } from '../hooks/useDebounce.js';
import type { Wish } from '../types.js';
import { WishCard } from './WishCard.js';

const PAGE_LIMIT = 6;

export interface WishWallRef {
  refresh: () => void;
}

interface WishWallProps {
  onOpenPlanModal: (wish: Wish) => void;
  onOpenPosterModal: (blob: Blob, filename: string) => void;
  onShowToast: (msg: string) => void;
}

export const WishWall = forwardRef<WishWallRef, WishWallProps>(
  ({ onOpenPlanModal, onOpenPosterModal, onShowToast }, ref) => {
    const { language, t } = useLanguage();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [showCompleted, setShowCompleted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const activeAbortControllerRef = useRef<AbortController | null>(null);
    const sectionRef = useRef<HTMLElement | null>(null);

    const fetchWishes = useCallback(async () => {
      activeAbortControllerRef.current?.abort();
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      setIsLoading(true);
      setHasError(false);
      try {
        const result = await WishAPI.getWishes(
          'all',
          debouncedSearchQuery.trim(),
          undefined,
          undefined,
          'all',
          controller.signal
        );
        if (controller.signal.aborted) return;
        setWishes(result.wishes || []);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to load wish wall:', error);
        setHasError(true);
      } finally {
        if (activeAbortControllerRef.current === controller) {
          setIsLoading(false);
          activeAbortControllerRef.current = null;
        }
      }
    }, [debouncedSearchQuery]);

    useEffect(() => {
      return () => activeAbortControllerRef.current?.abort();
    }, []);

    useEffect(() => {
      setCurrentPage(1);
      void fetchWishes();
    }, [fetchWishes]);

    const filteredWishes = wishes.filter(wish => {
      const statusMatch = showCompleted ? wish.status === 'completed' : wish.status !== 'completed';
      const categoryMatch = activeFilter === 'all' || wish.category === activeFilter;
      return statusMatch && categoryMatch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredWishes.length / PAGE_LIMIT));

    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [currentPage, totalPages]);

    useImperativeHandle(
      ref,
      () => ({
        refresh: () => {
          setCurrentPage(1);
          void fetchWishes();
        },
      }),
      [fetchWishes]
    );

    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIdx = (validPage - 1) * PAGE_LIMIT;
    const pageWishes = filteredWishes.slice(startIdx, startIdx + PAGE_LIMIT);

    const goToPage = useCallback(
      (page: number) => {
        if (page < 1 || page > totalPages || page === validPage) return;
        setCurrentPage(page);
        requestAnimationFrame(() => {
          sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      [totalPages, validPage]
    );

    const handleBlessed = useCallback((wishId: string, blessings: number) => {
      setWishes(prev => prev.map(wish => (wish.id === wishId ? { ...wish, blessings } : wish)));
    }, []);

    return (
      <section ref={sectionRef} className="wish-wall-section" id="wish-wall">
        <div className="section-header">
          <h2 className="section-main-title">{t('wallTitle')}</h2>
          <p className="section-sub-title">{t('wallSubtitle')}</p>
        </div>

        <div className="wall-controls glass-panel">
          <div className="filter-pills" id="wallFilterPills">
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              aria-pressed={activeFilter === 'all'}
              onClick={() => {
                setActiveFilter('all');
                setCurrentPage(1);
              }}
            >
              {t('filterAll')}
            </button>
            {CATEGORY_IDS.map(cat => (
              <button
                key={cat}
                type="button"
                className={`filter-pill ${activeFilter === cat ? 'active' : ''}`}
                aria-pressed={activeFilter === cat}
                onClick={() => {
                  setActiveFilter(cat);
                  setCurrentPage(1);
                }}
              >
                {getCategoryLabel(cat, language)}
              </button>
            ))}
          </div>

          <div className="wall-actions">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                id="searchInput"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              className={`wall-refresh-btn ${isLoading ? 'loading' : ''}`}
              id="refreshWallBtn"
              type="button"
              title={t('refreshWallTitle')}
              onClick={() => void fetchWishes()}
              disabled={isLoading}
            >
              <span className="refresh-icon" aria-hidden="true">
                ↻
              </span>
              <span>{t('refreshWall')}</span>
            </button>
            <label className="completed-filter-label" id="completedFilterContainer">
              <input
                type="checkbox"
                id="showCompletedCheckbox"
                className="completed-checkbox"
                checked={showCompleted}
                onChange={e => {
                  setShowCompleted(e.target.checked);
                  setCurrentPage(1);
                }}
              />
              <span>{t('showCompleted')}</span>
            </label>
          </div>
        </div>

        <div className="wish-grid" id="wishGrid">
          {hasError ? (
            <div className="empty-wall glass-panel">
              <div className="empty-icon">🪐</div>
              <p>{t('wallLoadError')}</p>
            </div>
          ) : isLoading ? (
            <div className="empty-wall glass-panel" role="status" aria-live="polite">
              <div className="empty-icon">✨</div>
              <p>{t('wallLoading')}</p>
            </div>
          ) : pageWishes.length === 0 ? (
            <div className="empty-wall glass-panel">
              <div className="empty-icon">🌟</div>
              <p>{t('wallEmpty')}</p>
            </div>
          ) : (
            pageWishes.map(wish => (
              <WishCard
                key={wish.id}
                wish={wish}
                onOpenPlanModal={onOpenPlanModal}
                onOpenPosterModal={onOpenPosterModal}
                onShowToast={onShowToast}
                onBlessed={handleBlessed}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="wall-pagination" id="wallPagination">
            <button
              type="button"
              className="page-btn"
              disabled={validPage <= 1}
              onClick={() => goToPage(validPage - 1)}
            >
              {t('prevPage')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                className={`page-btn ${page === validPage ? 'active' : ''}`}
                aria-current={page === validPage ? 'page' : undefined}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="page-btn"
              disabled={validPage >= totalPages}
              onClick={() => goToPage(validPage + 1)}
            >
              {t('nextPage')}
            </button>
          </div>
        )}
      </section>
    );
  }
);

WishWall.displayName = 'WishWall';
