import type React from 'react';
import { useEffect, useId, useState } from 'react';
import type { AIPlan, AIPlanPhase } from '../../types.js';

interface PlanEditorModalProps {
  initialPlan?: AIPlan;
  onChange: (updatedPlan: AIPlan) => void;
}

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({ initialPlan = {}, onChange }) => {
  const idPrefix = useId().replace(/:/g, '');
  const [summary, setSummary] = useState(initialPlan.summary || '');
  const [inspiration, setInspiration] = useState(initialPlan.inspiration || '');
  const [firstStep, setFirstStep] = useState(initialPlan.firstStep || '');
  const [roadmap, setRoadmap] = useState<AIPlanPhase[]>(
    Array.isArray(initialPlan.roadmap)
      ? initialPlan.roadmap
      : Array.isArray(initialPlan.phases)
        ? initialPlan.phases
        : []
  );
  const [habitsAndTools, setHabitsAndTools] = useState<string[]>(
    Array.isArray(initialPlan.habitsAndTools)
      ? initialPlan.habitsAndTools
      : initialPlan.habits || []
  );
  const [pitfalls, setPitfalls] = useState<string[]>(
    Array.isArray(initialPlan.pitfalls) ? initialPlan.pitfalls : []
  );

  useEffect(() => {
    setSummary(initialPlan.summary || '');
  }, [initialPlan.summary]);
  useEffect(() => {
    setInspiration(initialPlan.inspiration || '');
  }, [initialPlan.inspiration]);
  useEffect(() => {
    setFirstStep(initialPlan.firstStep || '');
  }, [initialPlan.firstStep]);
  useEffect(() => {
    setRoadmap(
      Array.isArray(initialPlan.roadmap)
        ? initialPlan.roadmap
        : Array.isArray(initialPlan.phases)
          ? initialPlan.phases
          : []
    );
  }, [initialPlan.roadmap, initialPlan.phases]);
  useEffect(() => {
    setHabitsAndTools(
      Array.isArray(initialPlan.habitsAndTools)
        ? initialPlan.habitsAndTools
        : initialPlan.habits || []
    );
  }, [initialPlan.habitsAndTools, initialPlan.habits]);
  useEffect(() => {
    setPitfalls(Array.isArray(initialPlan.pitfalls) ? initialPlan.pitfalls : []);
  }, [initialPlan.pitfalls]);

  const notifyChange = (patch: Partial<AIPlan>) => {
    onChange({
      summary,
      inspiration,
      roadmap,
      habitsAndTools,
      pitfalls,
      firstStep,
      ...patch,
    });
  };

  const previewPlan: AIPlan = {
    summary,
    inspiration,
    roadmap,
    habitsAndTools,
    pitfalls,
    firstStep,
  };

  const handleStepChange = (index: number, field: keyof AIPlanPhase, value: string) => {
    const updated = roadmap.map((step, idx) =>
      idx === index ? { ...step, [field]: value } : step
    );
    setRoadmap(updated);
    notifyChange({ roadmap: updated });
  };

  const handleAddStep = () => {
    const updated = [...roadmap, { phase: '', timeline: '', title: '', action: '' }];
    setRoadmap(updated);
    notifyChange({ roadmap: updated });
  };

  const handleRemoveStep = (index: number) => {
    const updated = roadmap.filter((_, idx) => idx !== index);
    setRoadmap(updated);
    notifyChange({ roadmap: updated });
  };

  const handleHabitChange = (index: number, value: string) => {
    const updated = habitsAndTools.map((item, idx) => (idx === index ? value : item));
    setHabitsAndTools(updated);
    notifyChange({ habitsAndTools: updated });
  };

  const handleAddHabit = () => {
    const updated = [...habitsAndTools, ''];
    setHabitsAndTools(updated);
    notifyChange({ habitsAndTools: updated });
  };

  const handleRemoveHabit = (index: number) => {
    const updated = habitsAndTools.filter((_, idx) => idx !== index);
    setHabitsAndTools(updated);
    notifyChange({ habitsAndTools: updated });
  };

  const handlePitfallChange = (index: number, value: string) => {
    const updated = pitfalls.map((item, idx) => (idx === index ? value : item));
    setPitfalls(updated);
    notifyChange({ pitfalls: updated });
  };

  const handleAddPitfall = () => {
    const updated = [...pitfalls, ''];
    setPitfalls(updated);
    notifyChange({ pitfalls: updated });
  };

  const handleRemovePitfall = (index: number) => {
    const updated = pitfalls.filter((_, idx) => idx !== index);
    setPitfalls(updated);
    notifyChange({ pitfalls: updated });
  };

  return (
    <div className="plan-form-container">
      <div className="plan-form-section">
        <label className="plan-section-title" htmlFor={`${idPrefix}-summary`}>
          <span className="section-icon">✦</span> 诗意心愿 · 愿望重写
        </label>
        <textarea
          id={`${idPrefix}-summary`}
          className="plan-form-textarea"
          placeholder="古风五言/七言单句，如：夜阑卧听风吹雨 / 英文为十四行诗单句"
          value={summary}
          onChange={e => {
            setSummary(e.target.value);
            notifyChange({ summary: e.target.value });
          }}
        />
      </div>

      <div className="plan-form-section">
        <label className="plan-section-title" htmlFor={`${idPrefix}-inspiration`}>
          <span className="section-icon">✦</span> 励志寄语与洞察
        </label>
        <textarea
          id={`${idPrefix}-inspiration`}
          className="plan-form-textarea"
          placeholder="输入温暖励志且富有哲理的洞察与激励..."
          value={inspiration}
          onChange={e => {
            setInspiration(e.target.value);
            notifyChange({ inspiration: e.target.value });
          }}
        />
      </div>

      <div className="plan-form-section">
        <div className="plan-section-title">
          <span className="section-icon">✦</span> 行动路线图（阶段规划）
        </div>
        <div className="roadmap-steps-list">
          {roadmap.map((step, idx) => (
            <div
              key={`${idx}-${step.phase}-${step.title ?? step.name}`}
              className="roadmap-step-editor"
            >
              <div className="roadmap-step-header">
                <span className="step-num-badge">阶段 {idx + 1}</span>
                <button
                  type="button"
                  className="btn-remove-step"
                  onClick={() => handleRemoveStep(idx)}
                >
                  ✕ 删除阶段
                </button>
              </div>
              <div className="step-grid-2">
                <div className="field">
                  <label className="field-label" htmlFor={`${idPrefix}-phase-${idx}`}>
                    阶段名称
                  </label>
                  <input
                    id={`${idPrefix}-phase-${idx}`}
                    type="text"
                    className="plan-form-input step-phase-input"
                    placeholder="如: 准备阶段"
                    value={step.phase || ''}
                    onChange={e => handleStepChange(idx, 'phase', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor={`${idPrefix}-timeline-${idx}`}>
                    预计周期
                  </label>
                  <input
                    id={`${idPrefix}-timeline-${idx}`}
                    type="text"
                    className="plan-form-input step-timeline-input"
                    placeholder="如: 第 1 - 2 周"
                    value={step.timeline || ''}
                    onChange={e => handleStepChange(idx, 'timeline', e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${idPrefix}-title-${idx}`}>
                  阶段主题
                </label>
                <input
                  id={`${idPrefix}-title-${idx}`}
                  type="text"
                  className="plan-form-input step-title-input"
                  placeholder="输入阶段核心主题..."
                  value={step.title || step.name || ''}
                  onChange={e => handleStepChange(idx, 'title', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${idPrefix}-action-${idx}`}>
                  具体行动方案
                </label>
                <textarea
                  id={`${idPrefix}-action-${idx}`}
                  className="plan-form-textarea step-action-input"
                  placeholder="详细说明本阶段需执行的具体步骤..."
                  value={step.action || (Array.isArray(step.tasks) ? step.tasks.join('; ') : '')}
                  onChange={e => handleStepChange(idx, 'action', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn-add-item" onClick={handleAddStep}>
          <span>+</span> 添加行动阶段
        </button>
      </div>

      {/* Micro-habits & Tools */}
      <div className="plan-form-section">
        <div className="plan-section-title">
          <span className="section-icon">✦</span> 关键微习惯与工具
        </div>
        <div className="dynamic-items-list">
          {habitsAndTools.map((habit, idx) => (
            <div key={`${idx}-${habit}`} className="dynamic-item-row">
              <input
                id={`${idPrefix}-habit-${idx}`}
                type="text"
                className="plan-form-input habit-item-input"
                placeholder="输入建议养成的微习惯或推荐工具..."
                value={habit}
                onChange={e => handleHabitChange(idx, e.target.value)}
              />
              <button
                type="button"
                className="btn-remove-item"
                title="删除项"
                onClick={() => handleRemoveHabit(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-add-item" onClick={handleAddHabit}>
          ＋ 添加微习惯/工具
        </button>
      </div>

      {/* Pitfalls */}
      <div className="plan-form-section">
        <div className="plan-section-title">
          <span className="section-icon">✦</span> 避坑指南与应对策略
        </div>
        <div className="dynamic-items-list">
          {pitfalls.map((pitfall, idx) => (
            <div key={`${idx}-${pitfall}`} className="dynamic-item-row">
              <input
                id={`${idPrefix}-pitfall-${idx}`}
                type="text"
                className="plan-form-input pitfall-item-input"
                placeholder="输入可能遇到的坑及对应解决办法..."
                value={pitfall}
                onChange={e => handlePitfallChange(idx, e.target.value)}
              />
              <button
                type="button"
                className="btn-remove-item"
                title="删除项"
                onClick={() => handleRemovePitfall(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-add-item" onClick={handleAddPitfall}>
          ＋ 添加避坑指南
        </button>
      </div>

      {/* First Step */}
      <div className="plan-form-section">
        <label className="plan-section-title" htmlFor={`${idPrefix}-first-step`}>
          <span className="section-icon">✦</span> 24小时内第一步
        </label>
        <textarea
          id={`${idPrefix}-first-step`}
          className="plan-form-textarea"
          placeholder="24 小时内可以立即开始并完成的第一小步..."
          value={firstStep}
          onChange={e => {
            setFirstStep(e.target.value);
            notifyChange({ firstStep: e.target.value });
          }}
        />
      </div>

      <details className="json-debug-toggle">
        <summary>🔍 查看/调试 原始 JSON 数据</summary>
        <textarea
          className="json-debug-textarea"
          readOnly
          value={JSON.stringify(previewPlan, null, 2)}
          aria-label="原始 JSON 数据"
        />
      </details>
    </div>
  );
};
