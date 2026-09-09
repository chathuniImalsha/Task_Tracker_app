import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "U";

  const isSupervisor = user?.role === "supervisor";

  return (
    <header className="site-header">
      <div className="nav-container">
        <Link to={isSupervisor ? "/supervisor" : "/intern"} className="brand-wrapper">
          <div className="brand-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <div className="brand-title">Task<span>Pulse</span></div>
          </div>
        </Link>

        <div className="nav-right">
          {user ? (
            <>
              <div className="user-pill">
                <div className="user-avatar" title={user.email}>
                  {initials}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role-badge ${isSupervisor ? "role-supervisor" : "role-intern"}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Sign out of your account"
                aria-label="Logout"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="status-indicator" style={{ fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Secure Authentication</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
