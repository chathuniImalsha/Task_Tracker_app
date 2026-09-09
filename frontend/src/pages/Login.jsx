import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "supervisor" ? "/supervisor" : "/intern");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid email or password. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Glow Effect Backdrop */}
      <div className="login-backdrop-glow" aria-hidden="true" />

      <div className="login-grid">
        {/* ===================== LEFT COLUMN: BRANDING, HEADLINE, ILLUSTRATION, BENEFITS ===================== */}
        <div className="login-left-panel">
          {/* Brand Header */}
          <div className="login-brand-header">
            <div className="login-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="login-brand-text">Task<span>Pulse</span></span>
          </div>

          {/* Main Headline */}
          <h1 className="login-hero-heading">
            Stay on track.
            <span className="accent-text">Get things done.</span>
          </h1>

          {/* Supporting Text */}
          <p className="login-hero-subtitle">
            Manage your tasks, share your progress, and stay connected with your supervisor — all in one place.
          </p>

          {/* Productivity SaaS Illustration */}
          <div className="login-illustration-card" aria-hidden="true">
            <svg
              viewBox="0 0 420 220"
              width="100%"
              height="auto"
              style={{ display: "block" }}
            >
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
                <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#F8FAFC" />
                </linearGradient>
                <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.06" />
                </filter>
              </defs>

              {/* Window Frame */}
              <rect x="4" y="4" width="412" height="212" rx="10" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#cardShadow)" />
              
              {/* Window Top Bar */}
              <rect x="4" y="4" width="412" height="28" rx="10" fill="#F1F5F9" />
              <rect x="4" y="24" width="412" height="8" fill="#F1F5F9" />
              <line x1="4" y1="32" x2="416" y2="32" stroke="#E2E8F0" strokeWidth="1" />

              {/* Window Controls Dots */}
              <circle cx="20" cy="18" r="4.5" fill="#EF4444" opacity="0.85" />
              <circle cx="34" cy="18" r="4.5" fill="#F59E0B" opacity="0.85" />
              <circle cx="48" cy="18" r="4.5" fill="#10B981" opacity="0.85" />

              {/* Top Bar Title / Search Mock */}
              <rect x="140" y="11" width="140" height="14" rx="4" fill="#E2E8F0" opacity="0.6" />

              {/* Task Item 1 - Completed */}
              <g transform="translate(20, 48)">
                <rect x="0" y="0" width="250" height="42" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <circle cx="20" cy="21" r="9" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" />
                <polyline points="16 21 19 24 25 18" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <text x="38" y="19" fontFamily="inherit" fontSize="11" fontWeight="700" fill="#1E293B">API Integration &amp; Endpoints</text>
                <text x="38" y="32" fontFamily="inherit" fontSize="9.5" fill="#64748B">Due Today &bull; Assigned to you</text>
                <rect x="186" y="12" width="54" height="18" rx="9" fill="#ECFDF5" />
                <text x="213" y="24" textAnchor="middle" fontFamily="inherit" fontSize="9" fontWeight="700" fill="#059669">Done</text>
              </g>

              {/* Task Item 2 - In Progress with Progress Bar */}
              <g transform="translate(20, 98)">
                <rect x="0" y="0" width="250" height="52" rx="8" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="1.5" />
                <circle cx="20" cy="21" r="9" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.5" />
                <circle cx="20" cy="21" r="3.5" fill="#4F46E5" />
                <text x="38" y="19" fontFamily="inherit" fontSize="11" fontWeight="700" fill="#1E293B">Authentication UI &amp; Review</text>
                <rect x="176" y="12" width="64" height="18" rx="9" fill="#EFF6FF" />
                <text x="208" y="24" textAnchor="middle" fontFamily="inherit" fontSize="9" fontWeight="700" fill="#2563EB">In Progress</text>
                
                {/* Progress Bar */}
                <rect x="38" y="33" width="195" height="6" rx="3" fill="#E2E8F0" />
                <rect x="38" y="33" width="145" height="6" rx="3" fill="url(#brandGrad)" />
              </g>

              {/* Task Item 3 - High Priority */}
              <g transform="translate(20, 158)">
                <rect x="0" y="0" width="250" height="42" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <circle cx="20" cy="21" r="9" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
                <text x="38" y="19" fontFamily="inherit" fontSize="11" fontWeight="700" fill="#1E293B">Daily Standup Progress Log</text>
                <text x="38" y="32" fontFamily="inherit" fontSize="9.5" fill="#64748B">Supervisor review pending</text>
                <rect x="180" y="12" width="60" height="18" rx="9" fill="#FFF1F2" />
                <text x="210" y="24" textAnchor="middle" fontFamily="inherit" fontSize="9" fontWeight="700" fill="#E11D48">High</text>
              </g>

              {/* Right Side Card: Productivity Metric Card */}
              <g transform="translate(285, 48)">
                <rect x="0" y="0" width="115" height="74" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" filter="url(#cardShadow)" />
                <rect x="10" y="10" width="24" height="24" rx="6" fill="#EEF2FF" />
                <path d="M16 24L20 18L24 21L28 15" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <text x="40" y="20" fontFamily="inherit" fontSize="9" fontWeight="600" fill="#64748B">Completion</text>
                <text x="40" y="32" fontFamily="inherit" fontSize="12" fontWeight="800" fill="#0F172A">94.2%</text>
                <rect x="10" y="46" width="95" height="18" rx="9" fill="#ECFDF5" />
                <text x="57" y="58" textAnchor="middle" fontFamily="inherit" fontSize="9" fontWeight="700" fill="#059669">&uarr; +18% this week</text>
              </g>

              {/* Right Side Card: Calendar Mini Widget */}
              <g transform="translate(285, 130)">
                <rect x="0" y="0" width="115" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <text x="12" y="20" fontFamily="inherit" fontSize="9.5" fontWeight="700" fill="#475569">Weekly Tasks</text>
                <g transform="translate(10, 30)">
                  <rect x="0" y="0" width="16" height="22" rx="4" fill="#F1F5F9" />
                  <text x="8" y="14" textAnchor="middle" fontFamily="inherit" fontSize="8" fontWeight="700" fill="#64748B">M</text>
                  
                  <rect x="20" y="0" width="16" height="22" rx="4" fill="#F1F5F9" />
                  <text x="28" y="14" textAnchor="middle" fontFamily="inherit" fontSize="8" fontWeight="700" fill="#64748B">T</text>
                  
                  <rect x="40" y="0" width="16" height="22" rx="4" fill="url(#brandGrad)" />
                  <text x="48" y="14" textAnchor="middle" fontFamily="inherit" fontSize="8" fontWeight="700" fill="#FFFFFF">W</text>
                  
                  <rect x="60" y="0" width="16" height="22" rx="4" fill="#F1F5F9" />
                  <text x="68" y="14" textAnchor="middle" fontFamily="inherit" fontSize="8" fontWeight="700" fill="#64748B">T</text>
                  
                  <rect x="80" y="0" width="16" height="22" rx="4" fill="#F1F5F9" />
                  <text x="88" y="14" textAnchor="middle" fontFamily="inherit" fontSize="8" fontWeight="700" fill="#64748B">F</text>
                </g>
                <text x="12" y="63" fontFamily="inherit" fontSize="8" fill="#94A3B8">Active sprint &bull; Day 3</text>
              </g>
            </svg>
          </div>

          {/* Three Key Benefits */}
          <div className="login-benefits-list">
            <div className="login-benefit-item">
              <div className="login-benefit-check" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Manage your assigned tasks</span>
            </div>

            <div className="login-benefit-item">
              <div className="login-benefit-check" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Keep your supervisor updated</span>
            </div>

            <div className="login-benefit-item">
              <div className="login-benefit-check" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Track your daily progress</span>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT COLUMN: LOGIN FORM CARD ===================== */}
        <div className="login-right-panel">
          <div className="login-card-container">
            {/* Secure Authentication Badge */}
            <div className="login-secure-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Secure Authentication</span>
            </div>

            {/* Form Title & Subtitle */}
            <h2 className="login-form-heading">Welcome to TaskPulse</h2>
            <p className="login-form-subtitle">
              Sign in to access your dashboard &amp; task logs
            </p>

            {/* Error Message Box */}
            {error && (
              <div className="alert-box alert-error" role="alert" style={{ marginBottom: "1.25rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div style={{ flex: 1 }}>{error}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">
                  Work Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="email-input"
                    type="email"
                    className="form-input login-input-themed"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      pointerEvents: "none",
                    }}
                    aria-hidden="true"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password-input">
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    className="form-input login-input-themed"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      pointerEvents: "none",
                    }}
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>

                  <button
                    type="button"
                    className="login-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: "100%", marginTop: "0.75rem" }}
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  "Sign In to Account"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
