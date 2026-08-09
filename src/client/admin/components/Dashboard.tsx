import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORY_NAMES, isCategoryId } from '../../../categories.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import type { UnpaginatedWishListResult, Wish } from '../../types.js';
import { adminApi } from '../api.js';
import { AdminWishCard } from './AdminWishCard.js';

interface DashboardProps {
  onLogout: () => Promise<void>;
  onUnauthorized: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, onUnauthorized }) => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [listVersion, setListVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{ message: string; isError: boolean }>({
    message: '',
    isError: false,
  });
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wishesRequestRef = useRef<AbortController | null>(null);

  const showNotice = useCallback((message: string, isError = false) => {
    if (noticeTimerRef.current !== null) {
      clearTimeout(noticeTimerRef.current);
    }
    setNotice({ message, isError });
    noticeTimerRef.current = setTimeout(() => {
      noticeTimerRef.current = null;
      setNotice({ message: '', isError: false });
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const loadWishes = useCallback(async () => {
    wishesRequestRef.current?.abort();
    const controller = new AbortController();
    wishesRequestRef.current = controller;
    setIsLoading(true);
    try {
      const data = await adminApi<UnpaginatedWishListResult>('/wishes', {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setWishes(data.wishes || []);
      setListVersion(version => version + 1);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        onUnauthorized();
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        showNotice(msg, true);
      }
    } finally {
      if (wishesRequestRef.current === controller) {
        setIsLoading(false);
        wishesRequestRef.current = null;
      }
    }
  }, [onUnauthorized, showNotice]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void loadWishes();
    }, 0);
    return () => clearTimeout(loadTimer);
  }, [loadWishes]);

  useEffect(() => {
    const requestRef = wishesRequestRef;
    return () => requestRef.current?.abort();
  }, []);

  const handleWishUpdated = (updatedWish: Wish) => {
    setWishes(prev => prev.map(item => (item.id === updatedWish.id ? updatedWish : item)));
  };

  const handleWishDeleted = (wishId: string) => {
    setWishes(prev => prev.filter(item => item.id !== wishId));
  };

  const term = debouncedSearchQuery.trim().toLocaleLowerCase('zh-CN');
  const filteredWishes = term
    ? wishes.filter(wish => {
        const categoryText = wish.categories
          .map(c => (isCategoryId(c) ? CATEGORY_NAMES.zh[c] : ''))
          .join(' ');
        return `${wish.title} ${categoryText}`.toLocaleLowerCase('zh-CN').includes(term);
      })
    : wishes;

  return (
    <section className="dashboard" id="dashboard">
      <header className="dashboard-header glass-panel">
        <div className="header-brand">
          <div className="brand-badge">
            <span className="logo-icon">✦</span>
            <span className="eyebrow-text">WISH FOREST ADMIN</span>
          </div>
          <h1 className="dashboard-title">愿望管理台</h1>
          <p className="muted-count" id="wishCount">
            {isLoading
              ? '正在读取愿望...'
              : `共 ${wishes.length} 条愿望${term ? `，当前显示 ${filteredWishes.length} 条` : ''}`}
          </p>
        </div>
        <div className="header-actions">
          <a
            className="btn-secondary nav-link-btn"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>查看前台</span> ↗
          </a>
          <button
            className="btn-secondary logout-btn"
            id="logoutButton"
            type="button"
            onClick={onLogout}
          >
            退出登录
          </button>
        </div>
      </header>

      <div className="toolbar glass-panel">
        <div className="search-field">
          <span className="search-label">搜索愿望</span>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              id="searchInput"
              type="search"
              placeholder="输入愿望内容或分类关键字..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          className="btn-secondary refresh-btn"
          id="refreshButton"
          type="button"
          onClick={loadWishes}
          disabled={isLoading}
        >
          <span className="refresh-icon">🔄</span> 刷新列表
        </button>
      </div>

      {notice.message && (
        <div className={`notice ${notice.isError ? 'error' : ''}`} id="notice" role="status">
          {notice.message}
        </div>
      )}

      <div className="wish-list" id="wishList">
        {filteredWishes.map(wish => (
          <AdminWishCard
            key={`${wish.id}-${listVersion}`}
            wish={wish}
            onUpdated={handleWishUpdated}
            onDeleted={handleWishDeleted}
            onShowNotice={showNotice}
            onUnauthorized={onUnauthorized}
          />
        ))}
      </div>

      {filteredWishes.length === 0 && !isLoading && (
        <div className="empty-state glass-panel" id="emptyState">
          没有找到符合条件的愿望。
        </div>
      )}
    </section>
  );
};
