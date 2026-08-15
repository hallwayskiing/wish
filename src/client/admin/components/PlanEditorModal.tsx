import type React from 'react';
import { useId, useState } from 'react';
import type { AIPlan, AIPlanPhase } from '../../types.js';

interface EditorPhase extends AIPlanPhase {
  id: string;
}

interface EditorListItem {
  id: string;
  text: string;
}

interface PlanEditorModalProps {
  initialPlan?: AIPlan;
  onChange: (updatedPlan: AIPlan) => void;
}

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({ initialPlan = {}, onChange }) => {
  const idPrefix = useId().replace(/:/g, '');
  const [summary, setSummary] = useState(initialPlan.summary || '');
  const [inspiration, setInspiration] = useState(initialPlan.inspiration || '');
  const [firstStep, setFirstStep] = useState(initialPlan.firstStep || '');
  const [roadmap, setRoadmap] = useState<EditorPhase[]>(() => {
    const raw = Array.isArray(initialPlan.roadmap)
      ? initialPlan.roadmap
      : Array.isArray(initialPlan.phases)
        ? initialPlan.phases
        : [];
    return raw.map(step => ({ ...step, id: crypto.randomUUID() }));
  });
  const [habitsAndSystems, setHabitsAndSystems] = useState<EditorListItem[]>(() => {
    const raw = Array.isArray(initialPlan.habitsAndSystems) ? initialPlan.habitsAndSystems : [];
    return raw.map(text => ({ id: crypto.randomUUID(), text }));
  });
  const [pitfalls, setPitfalls] = useState<EditorListItem[]>(() => {
    const raw = Array.isArray(initialPlan.pitfalls) ? initialPlan.pitfalls : [];
    return raw.map(text => ({ id: crypto.randomUUID(), text }));
  });

  const serializePlan = (
    nextSummary = summary,
    nextInspiration = inspiration,
    nextRoadmap = roadmap,
    nextHabits = habitsAndSystems,
    nextPitfalls = pitfalls,
    nextFirstStep = firstStep
  ): AIPlan => ({
    summary: nextSummary,
    inspiration: nextInspiration,
    roadmap: nextRoadmap.map(({ id: _id, ...step }) => step),
    habitsAndSystems: nextHabits.map(item => item.text),
    pitfalls: nextPitfalls.map(item => item.text),
    firstStep: nextFirstStep,
  });

  const notifyChange = (updatedPlan: AIPlan) => {
    onChange(updatedPlan);
  };

  const handleStepChange = (id: string, field: keyof AIPlanPhase, value: string) => {
    const updated = roadmap.map(step => (step.id === id ? { ...step, [field]: value } : step));
    setRoadmap(updated);
    notifyChange(
      serializePlan(summary, inspiration, updated, habitsAndSystems, pitfalls, firstStep)
    );
  };

  const handleAddStep = () => {
    const updated = [
      ...roadmap,
      { id: crypto.randomUUID(), phase: '', timeline: '', title: '', action: '' },
    ];
    setRoadmap(updated);
    notifyChange(
      serializePlan(summary, inspiration, updated, habitsAndSystems, pitfalls, firstStep)
    );
  };

  const handleRemoveStep = (id: string) => {
    const updated = roadmap.filter(step => step.id !== id);
    setRoadmap(updated);
    notifyChange(
      serializePlan(summary, inspiration, updated, habitsAndSystems, pitfalls, firstStep)
    );
  };

  const handleHabitChange = (id: string, value: string) => {
    const updated = habitsAndSystems.map(item =>
      item.id === id ? { ...item, text: value } : item
    );
    setHabitsAndSystems(updated);
    notifyChange(serializePlan(summary, inspiration, roadmap, updated, pitfalls, firstStep));
  };

  const handleAddHabit = () => {
    const updated = [...habitsAndSystems, { id: crypto.randomUUID(), text: '' }];
    setHabitsAndSystems(updated);
    notifyChange(serializePlan(summary, inspiration, roadmap, updated, pitfalls, firstStep));
  };

  const handleRemoveHabit = (id: string) => {
    const updated = habitsAndSystems.filter(item => item.id !== id);
    setHabitsAndSystems(updated);
    notifyChange(serializePlan(summary, inspiration, roadmap, updated, pitfalls, firstStep));
  };

  const handlePitfallChange = (id: string, value: string) => {
    const updated = pitfalls.map(item => (item.id === id ? { ...item, text: value } : item));
    setPitfalls(updated);
    notifyChange(
      serializePlan(summary, inspiration, roadmap, habitsAndSystems, updated, firstStep)
    );
  };

  const handleAddPitfall = () => {
    const updated = [...pitfalls, { id: crypto.randomUUID(), text: '' }];
    setPitfalls(updated);
    notifyChange(
      serializePlan(summary, inspiration, roadmap, habitsAndSystems, updated, firstStep)
    );
  };

  const handleRemovePitfall = (id: string) => {
    const updated = pitfalls.filter(item => item.id !== id);
    setPitfalls(updated);
    notifyChange(
      serializePlan(summary, inspiration, roadmap, habitsAndSystems, updated, firstStep)
    );
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
            const nextSummary = e.target.value;
            setSummary(nextSummary);
            notifyChange(
              serializePlan(
                nextSummary,
                inspiration,
                roadmap,
                habitsAndSystems,
                pitfalls,
                firstStep
              )
            );
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
            const nextInspiration = e.target.value;
            setInspiration(nextInspiration);
            notifyChange(
              serializePlan(
                summary,
                nextInspiration,
                roadmap,
                habitsAndSystems,
                pitfalls,
                firstStep
              )
            );
          }}
        />
      </div>

      <div className="plan-form-section">
        <div className="plan-section-title">
          <span className="section-icon">✦</span> 行动路线图（阶段规划）
        </div>
        <div className="roadmap-steps-list">
          {roadmap.map((step, idx) => (
            <div key={step.id} className="roadmap-step-editor">
              <div className="roadmap-step-header">
                <span className="step-num-badge">阶段 {idx + 1}</span>
                <button
                  type="button"
                  className="btn-remove-step"
                  onClick={() => handleRemoveStep(step.id)}
                >
                  ✕ 删除阶段
                </button>
              </div>
              <div className="step-grid-2">
                <div className="field">
                  <label className="field-label" htmlFor={`${idPrefix}-phase-${step.id}`}>
                    阶段名称
                  </label>
                  <input
                    id={`${idPrefix}-phase-${step.id}`}
                    type="text"
                    className="plan-form-input step-phase-input"
                    placeholder="如: 准备阶段"
                    value={step.phase || ''}
                    onChange={e => handleStepChange(step.id, 'phase', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor={`${idPrefix}-timeline-${step.id}`}>
                    预计周期
                  </label>
                  <input
                    id={`${idPrefix}-timeline-${step.id}`}
                    type="text"
                    className="plan-form-input step-timeline-input"
                    placeholder="如: 第 1 - 2 周"
                    value={step.timeline || ''}
                    onChange={e => handleStepChange(step.id, 'timeline', e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${idPrefix}-title-${step.id}`}>
                  阶段主题
                </label>
                <input
                  id={`${idPrefix}-title-${step.id}`}
                  type="text"
                  className="plan-form-input step-title-input"
                  placeholder="输入阶段核心主题..."
                  value={step.title || step.name || ''}
                  onChange={e => handleStepChange(step.id, 'title', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${idPrefix}-action-${step.id}`}>
                  具体行动方案
                </label>
                <textarea
                  id={`${idPrefix}-action-${step.id}`}
                  className="plan-form-textarea step-action-input"
                  placeholder="详细说明本阶段需执行的具体步骤..."
                  value={step.action || (Array.isArray(step.tasks) ? step.tasks.join('; ') : '')}
                  onChange={e => handleStepChange(step.id, 'action', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn-add-item" onClick={handleAddStep}>
          <span>+</span> 添加行动阶段
        </button>
      </div>

      {/* Key Habits & Execution Systems */}
      <div className="plan-form-section">
        <div className="plan-section-title">
          <span className="section-icon">✦</span> 关键习惯与执行机制
        </div>
        <div className="dynamic-items-list">
          {habitsAndSystems.map(habit => (
            <div key={habit.id} className="dynamic-item-row">
              <input
                id={`${idPrefix}-habit-${habit.id}`}
                type="text"
                className="plan-form-input habit-item-input"
                placeholder="输入包含频率、触发条件或反馈检查的执行机制..."
                value={habit.text}
                onChange={e => handleHabitChange(habit.id, e.target.value)}
              />
              <button
                type="button"
                className="btn-remove-item"
                title="删除项"
                onClick={() => handleRemoveHabit(habit.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-add-item" onClick={handleAddHabit}>
          ＋ 添加习惯/执行机制
        </button>
      </div>

      {/* Pitfalls */}
      <div className="plan-form-section">
        <div className="plan-section-title">
          <span className="section-icon">✦</span> 避坑指南与应对策略
        </div>
        <div className="dynamic-items-list">
          {pitfalls.map(pitfall => (
            <div key={pitfall.id} className="dynamic-item-row">
              <input
                id={`${idPrefix}-pitfall-${pitfall.id}`}
                type="text"
                className="plan-form-input pitfall-item-input"
                placeholder="输入可能遇到的坑及对应解决办法..."
                value={pitfall.text}
                onChange={e => handlePitfallChange(pitfall.id, e.target.value)}
              />
              <button
                type="button"
                className="btn-remove-item"
                title="删除项"
                onClick={() => handleRemovePitfall(pitfall.id)}
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
            const nextFirstStep = e.target.value;
            setFirstStep(nextFirstStep);
            notifyChange(
              serializePlan(
                summary,
                inspiration,
                roadmap,
                habitsAndSystems,
                pitfalls,
                nextFirstStep
              )
            );
          }}
        />
      </div>

      <details className="json-debug-toggle">
        <summary>🔍 查看/调试 原始 JSON 数据</summary>
        <textarea
          className="json-debug-textarea"
          readOnly
          value={JSON.stringify(serializePlan(), null, 2)}
          aria-label="原始 JSON 数据"
        />
      </details>
    </div>
  );
};
