import React, { useState } from 'react';

interface LoginPanelProps {
  onLogin: (password: string) => Promise<void>;
  errorMessage: string;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin, errorMessage }) => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onLogin(password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-panel glass-panel" id="loginPanel">
      <div className="brand-mark">✦</div>
      <p className="eyebrow">WISH FOREST ADMIN</p>
      <h1 className="admin-title">愿望管理台</h1>
      <p className="muted">请输入管理员密码以继续管理愿望蓝图</p>

      <form id="loginForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="passwordInput">管理密码</label>
          <input
            id="passwordInput"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            placeholder="输入管理员密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button className="btn-primary login-btn" id="loginButton" type="submit" disabled={isSubmitting}>
          <span className="btn-stars">✦</span>
          <span className="btn-text">{isSubmitting ? '验证中...' : '验证并登录'}</span>
        </button>
        {errorMessage && (
          <p className="form-message" id="loginMessage" role="alert">
            {errorMessage}
          </p>
        )}
      </form>
      <a className="back-link" href="/">
        ← 返回璀璨许愿阁
      </a>
    </section>
  );
};
