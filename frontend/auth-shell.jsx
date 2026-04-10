import React from 'react';
import { ArrowRight, CalendarSync, Dumbbell, ShieldCheck, Sparkles } from 'lucide-react';

const authHighlights = [
  {
    icon: CalendarSync,
    title: 'Adaptive weekly structure',
    copy: 'Your plan stays aligned with the week you actually have, not the ideal week you wish existed.',
  },
  {
    icon: Dumbbell,
    title: 'Home or minimal-gear ready',
    copy: 'Kinova is built around bodyweight, bands, compact setups, and practical training constraints.',
  },
  {
    icon: ShieldCheck,
    title: 'Progress without resets',
    copy: 'Rough sessions and imperfect days update the route instead of wiping momentum.',
  },
];

function BrandMark() {
  return (
    <a className="auth-brand-mark" href="/" aria-label="Kinova home">
      <img src="/logo_without_bg.svg" alt="" className="auth-brand-logo" />
      <span className="auth-brand-copy">
        <span className="auth-brand-name">Kinova</span>
        <span className="auth-brand-subtitle">Adaptive Training</span>
      </span>
    </a>
  );
}

export function AuthShell({ eyebrow, title, description, children, stageLabel }) {
  return (
    <div className="auth-shell">
      <section className="auth-brand-panel" aria-labelledby="auth-brand-title">
        <div className="auth-brand-sheen" aria-hidden="true" />
        <BrandMark />

        <div className="auth-brand-header">
          <span className="auth-kicker">{eyebrow}</span>
          <h1 id="auth-brand-title" className="auth-brand-title">
            {title}
          </h1>
          <p className="auth-brand-copyline">{description}</p>
        </div>

        <div className="auth-signal-card" aria-label="Kinova product summary">
          <div className="auth-signal-head">
            <div>
              <p className="auth-signal-label">Sample route</p>
              <p className="auth-signal-title">Pull strength rebuild</p>
            </div>
            <span className="auth-signal-badge">Week 04 active</span>
          </div>

          <div className="auth-signal-track">
            <div className="auth-signal-step auth-signal-step-current">
              <span className="auth-signal-step-label">Today</span>
              <strong>Assisted pull-up ladder</strong>
              <span>31 min</span>
            </div>
            <div className="auth-signal-step">
              <span className="auth-signal-step-label">Next</span>
              <strong>Volume steady, tempo cleaner</strong>
              <span>Adaptive</span>
            </div>
          </div>

          <div className="auth-signal-footer">
            <div>
              <span className="auth-signal-dot" />
              Route stays clear after missed days
            </div>
            <span>68% path locked</span>
          </div>
        </div>

        <div className="auth-highlight-list">
          {authHighlights.map(({ icon: Icon, title: itemTitle, copy }) => (
            <article key={itemTitle} className="auth-highlight-item">
              <span className="auth-highlight-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.9} />
              </span>
              <div>
                <h2>{itemTitle}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-stage-panel">
        <div className="auth-stage-frame">
          <div className="auth-stage-header">
            <span className="auth-stage-chip">
              <Sparkles size={14} strokeWidth={2} />
              {stageLabel}
            </span>
            <span className="auth-stage-note">Secure account access</span>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}

export function AuthMessageCard({ title, copy, children, tone = 'neutral' }) {
  return (
    <section className={`card auth-message-card auth-message-card-${tone}`}>
      <div className="auth-message-header">
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {children ? <div className="auth-message-body">{children}</div> : null}
    </section>
  );
}

export function AuthMetaList({ items }) {
  return (
    <div className="auth-meta-list">
      {items.map(({ label, value }) => (
        <div key={label} className="auth-meta-item">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function AuthLinkRow({ href, children }) {
  return (
    <a className="auth-link-row" href={href}>
      <span>{children}</span>
      <ArrowRight size={15} strokeWidth={2} />
    </a>
  );
}

export function AuthSkeleton({ label }) {
  return (
    <section className="card auth-loader-card" aria-live="polite" aria-busy="true">
      <div className="auth-loader-title">Preparing {label}</div>
      <div className="auth-loader-line" />
      <div className="auth-loader-line auth-loader-line-short" />
      <div className="auth-loader-button" />
    </section>
  );
}
