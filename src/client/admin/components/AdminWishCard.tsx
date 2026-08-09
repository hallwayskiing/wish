import type React from 'react';
import { useState } from 'react';
import { CATEGORY_NAMES } from '../../../categories.js';
import type { AIPlan, AIPlanPhase, Wish } from '../../types.js';
import { adminApi } from '../api.js';
import { PlanEditorModal } from './PlanEditorModal.js';

interface AdminWishCardProps {
  wish: Wish;
  onUpdated: (updatedWish: Wish) => void;
  onDeleted: (wishId: string) => void;
  onShowNotice: (msg: string, isError?: boolean) => void;
  onUnauthorized: () => void;
}

function trimValue(value?: string): string {
  return value?.trim() || '';
}

function normalizeAiPlan(plan: AIPlan): AIPlan {
  const normalized: AIPlan = {
    ...plan,
    inspiration: trimValue(plan.inspiration),
    firstStep: trimValue(plan.firstStep),
  };

  if (Array.isArray(plan.roadmap)) {
    const roadmap = plan.roadmap
      .map(
        (step): AIPlanPhase => ({
          ...step,
          phase: trimValue(step.phase),
          name: trimValue(step.name),
          title: trimValue(step.title),
          action: trimValue(step.action),
          timeline: trimValue(step.timeline),
          tasks: Array.isArray(step.tasks)
            ? step.tasks.map(task => task.trim()).filter(Boolean)
            : step.tasks,
        })
      )
      .filter(step =>
        Boolean(
          step.phase ||
            step.name ||
            step.title ||
            step.action ||
            step.timeline ||
            step.tasks?.length
        )
      );
    normalized.roadmap = roadmap;
  }

  if (Array.isArray(plan.habitsAndTools)) {
    normalized.habitsAndTools = plan.habitsAndTools.map(trimValue).filter(Boolean);
  }
  if (Array.isArray(plan.pitfalls)) {
    normalized.pitfalls = plan.pitfalls.map(trimValue).filter(Boolean);
  }

  return normalized;
}

export const AdminWishCard: React.FC<AdminWishCardProps> = ({
  wish,
  onUpdated,
  onDeleted,
  onShowNotice,
  onUnauthorized,
}) => {
  const [title, setTitle] = useState(wish.title || '');
  const [categories, setCategories] = useState<string[]>(() => [...wish.categories]);
  const [blessings, setBlessings] = useState(wish.blessings || 0);
  const [status, setStatus] = useState<'active' | 'completed'>(wish.status || 'active');
  const [aiPlan, setAiPlan] = useState<AIPlan>(wish.aiPlan || {});
  const [editorVersion, setEditorVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (val: string) => {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val || '未知时间';
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await adminApi<{ success: boolean; wish: Wish }>(
        `/wishes/${encodeURIComponent(wish.id)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title,
            categories,
            blessings: Number(blessings),
            status,
            aiPlan: normalizeAiPlan(aiPlan),
          }),
        }
      );
      setTitle(res.wish.title);
      setCategories([...res.wish.categories]);
      setBlessings(res.wish.blessings);
      setStatus(res.wish.status || 'active');
      setAiPlan(res.wish.aiPlan || {});
      setEditorVersion(version => version + 1);
      onUpdated(res.wish);
      onShowNotice('愿望及 AI 蓝图填空已成功保存！');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        onUnauthorized();
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        onShowNotice(msg, true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`确认永久删除这条愿望？\n\n“${title}”`)) return;
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await adminApi<{ success: boolean }>(`/wishes/${encodeURIComponent(wish.id)}`, {
        method: 'DELETE',
      });
      onDeleted(wish.id);
      onShowNotice('愿望已删除。');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        onUnauthorized();
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        onShowNotice(msg, true);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="wish-admin-card glass-panel">
      <div className="wish-meta">
        <span>创建时间：{formatDate(wish.createdAt)}</span>
        <span className="wish-id-tag">{wish.id}</span>
      </div>

      <div className="field wish-title-field">
        <label className="field-label" htmlFor={`wish-title-${wish.id}`}>
          愿望内容
        </label>
        <textarea
          id={`wish-title-${wish.id}`}
          className="wish-title-input"
          maxLength={300}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">分类领域（可多选 1-3 项）</legend>
        <div
          className="category-checkbox-group"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
        >
          {Object.entries(CATEGORY_NAMES.zh).map(([val, label]) => {
            const checked = categories.includes(val);
            return (
              <label
                key={val}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => {
                    setCategories(prev => {
                      if (e.target.checked) {
                        if (prev.includes(val)) return prev;
                        if (prev.length >= 3) return prev;
                        return [...prev, val];
                      }
                      const next = prev.filter(item => item !== val);
                      return next.length ? next : ['other'];
                    });
                  }}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="field">
        <label className="field-label" htmlFor={`wish-blessings-${wish.id}`}>
          助愿能量数
        </label>
        <input
          id={`wish-blessings-${wish.id}`}
          className="wish-blessings-input"
          type="number"
          min="0"
          max="999999999"
          step="1"
          value={blessings}
          onChange={e => setBlessings(Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`wish-status-${wish.id}`}>
          心愿状态
        </label>
        <select
          id={`wish-status-${wish.id}`}
          className="wish-status-select"
          value={status}
          onChange={e => setStatus(e.target.value as 'active' | 'completed')}
        >
          <option value="active">🌟 进行中</option>
          <option value="completed">🎉 已完成</option>
        </select>
      </div>

      <div className="card-actions">
        <button type="button" className="save-button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? '保存中...' : '保存变更'}
        </button>
        <button
          type="button"
          className="delete-button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? '删除中...' : '删除愿望'}
        </button>
      </div>

      <details className="plan-editor">
        <summary>
          <div className="summary-badge">
            <span>✦ 编辑 AI 行动蓝图 (填空模式)</span>
          </div>
          <span className="summary-indicator">▶</span>
        </summary>
        <PlanEditorModal key={editorVersion} initialPlan={aiPlan} onChange={setAiPlan} />
      </details>
    </article>
  );
};
