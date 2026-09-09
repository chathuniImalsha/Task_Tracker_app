import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="status-indicator">
            <span className="status-dot-pulse" aria-hidden="true"></span>
            <span>All systems operational</span>
          </div>
          <span className="footer-demo-hint">
            Demo Portal &bull; Role-based Access Control Active
          </span>
        </div>

        <div className="footer-right">
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            &copy; {new Date().getFullYear()} TaskPulse. Intern Task Tracking &amp; Reporting.
          </p>
        </div>
      </div>
    </footer>
  );
}
