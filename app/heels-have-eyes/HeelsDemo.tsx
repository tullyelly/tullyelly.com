/**
 * HEELS HAVE EYES demo component
 * Self-contained playground for the Bucks color system.
 * Styles and scripts are scoped under `.heels-demo`.
 */
'use client';

import { useEffect, useState } from 'react';

export default function HeelsDemo() {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [surface, setSurface] = useState<'white' | 'cream'>('white');

  useEffect(() => {
    if (window.localStorage.getItem('heels-demo-banner-dismissed') === 'true') {
      setBannerOpen(false);
    }
  }, []);

  const dismissBanner = () => {
    setBannerOpen(false);
    window.localStorage.setItem('heels-demo-banner-dismissed', 'true');
  };

  const handleSurface = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurface(e.target.checked ? 'cream' : 'white');
  };

  return (
    <div className="heels-demo" data-page="heels-have-eyes" data-surface={surface}>
      {bannerOpen && (
        <div className="demo-banner" role="status" aria-live="polite">
          Demo Page • HEELS HAVE EYES – style combinations showcase (no other pages modified)
          <button className="banner-close" aria-label="Dismiss demo banner" onClick={dismissBanner}>
            ×
          </button>
        </div>
      )}

      <header className="demo-header" role="banner">
        <nav className="demo-nav" aria-label="Style sections">
          <a href="#typography">Typography</a>
          <a href="#links">Links &amp; States</a>
          <a href="#buttons">Buttons</a>
          <a href="#cards">Cards</a>
          <a href="#forms">Forms</a>
          <a href="#alerts">Alerts &amp; Badges</a>
          <a href="#tables">Tables</a>
          <a href="#nav-footer">Nav &amp; Footer Mock</a>
          <a href="#matrix">State Matrix</a>
        </nav>
        <div className="surface-toggle">
          <label>
            <input type="checkbox" id="surfaceSwitch" onChange={handleSurface} /> Use Cream page wrapper
          </label>
        </div>
      </header>

      <main id="content" role="main">
        {/* Typography */}
        <section id="typography" className="section">
          <h2>Typography</h2>
          <div className="grid two-up">
            <article className="card on-white">
              <h3>On White Surface</h3>
              <h1>H1 Heading (default)</h1>
              <h2 className="green">H2 Heading (Bucks Green)</h2>
              <p>Body copy uses near-black for readability.</p>
              <p>
                Inline <a href="#" className="link-on-white">link on white</a> inside paragraph.
              </p>
              <small>Small &amp; muted text example.</small>
              <footer className="caption">
                tokens: text=--text-primary, bg=--surface-card, link=--link-on-white
              </footer>
            </article>
            <article className="card on-cream">
              <h3>On Cream Surface</h3>
              <h1>H1 Heading (default)</h1>
              <h2 className="green">H2 Heading (Bucks Green)</h2>
              <p>Body copy uses near-black; cream is for page tint.</p>
              <p>
                Inline <a href="#" className="link-on-cream">link on cream</a> inside paragraph.
              </p>
              <small>Small &amp; muted text example.</small>
              <footer className="caption">
                tokens: text=--text-primary, bg=--cream, link=--link-on-cream
              </footer>
            </article>
          </div>
        </section>

        {/* Links & States */}
        <section id="links" className="section">
          <h2>Links &amp; States</h2>
          <div className="grid two-up">
            <article className="card on-white">
              <ul className="states">
                <li><a href="#" className="state default">Default</a></li>
                <li><a href="#" className="state hover">Hover</a></li>
                <li><a href="#" className="state focus">Focus</a></li>
                <li><a href="#" className="state visited">Visited</a></li>
                <li><a href="#" className="state active">Active</a></li>
              </ul>
              <footer className="caption">links on white → --link-on-white</footer>
            </article>
            <article className="card on-cream">
              <ul className="states">
                <li><a href="#" className="state default cream">Default</a></li>
                <li><a href="#" className="state hover cream">Hover</a></li>
                <li><a href="#" className="state focus cream">Focus</a></li>
                <li><a href="#" className="state visited cream">Visited</a></li>
                <li><a href="#" className="state active cream">Active</a></li>
              </ul>
              <footer className="caption">links on cream → --link-on-cream</footer>
            </article>
          </div>
        </section>

        {/* Buttons */}
        <section id="buttons" className="section">
          <h2>Buttons</h2>
          <div className="grid two-up">
            <article className="card on-white">
              <button className="btn primary">Primary (Blue)</button>
              <button className="btn secondary">Secondary (Green)</button>
              <button className="btn ghost">Ghost</button>
              <div className="btn-row">
                <button className="btn primary hover">Hover</button>
                <button className="btn primary focus">Focus</button>
                <button className="btn primary active">Active</button>
                <button className="btn primary" disabled>Disabled</button>
              </div>
              <footer className="caption">fg on blue/green = white; focus ring visible</footer>
            </article>
            <article className="card on-cream">
              <button className="btn primary">Primary (Blue)</button>
              <button className="btn secondary">Secondary (Green)</button>
              <button className="btn ghost cream">Ghost on Cream</button>
              <footer className="caption">ghost uses blue border/text; contrast-safe on cream</footer>
            </article>
          </div>
        </section>

        {/* Cards */}
        <section id="cards" className="section">
          <h2>Cards</h2>
          <div className="grid two-up">
            <article className="card on-white">
              <h3 className="green">Card with Green Heading</h3>
              <p>Readable body on white with subtle borders.</p>
            </article>
            <article className="card on-cream">
              <h3>Card on Cream Wrapper</h3>
              <p>Demonstrates separation and tokens on tinted surface.</p>
            </article>
          </div>
        </section>

        {/* Forms */}
        <section id="forms" className="section">
          <h2>Forms</h2>
          <div className="grid two-up">
            <form className="card on-white" aria-label="Form on white">
              <label>Text input <input type="text" placeholder="Your text" /></label>
              <label>Select
                <select>
                  <option>Option A</option>
                  <option>Option B</option>
                </select>
              </label>
              <label>Textarea <textarea rows={3}></textarea></label>
              <label><input type="checkbox" /> Checkbox</label>
              <label><input type="radio" name="r" /> Radio</label>
              <label className="switch"><input type="checkbox" /> Toggle</label>
              <div className="validation">
                <p className="success">Success state example</p>
                <p className="error">Error state example</p>
              </div>
            </form>
            <form className="card on-cream" aria-label="Form on cream">
              <label>Text input <input type="text" placeholder="Your text" /></label>
              <label>Select
                <select>
                  <option>Option A</option>
                  <option>Option B</option>
                </select>
              </label>
              <label>Textarea <textarea rows={3}></textarea></label>
              <label><input type="checkbox" /> Checkbox</label>
              <label><input type="radio" name="rc" /> Radio</label>
              <label className="switch"><input type="checkbox" /> Toggle</label>
              <div className="validation">
                <p className="success">Success state example</p>
                <p className="error">Error state example</p>
              </div>
            </form>
          </div>
        </section>

        {/* Alerts & Badges */}
        <section id="alerts" className="section">
          <h2>Alerts &amp; Badges</h2>
          <div className="grid two-up">
            <article className="card on-white">
              <div className="alert info">Info alert</div>
              <div className="alert success">Success alert</div>
              <div className="alert warn">Warning alert</div>
              <div className="alert error">Error alert</div>
              <div className="badges">
                <span className="badge info">Info</span>
                <span className="badge success">Success</span>
                <span className="badge warn">Warn</span>
                <span className="badge error">Error</span>
              </div>
            </article>
            <article className="card on-cream">
              <div className="alert info">Info alert</div>
              <div className="alert success">Success alert</div>
              <div className="alert warn">Warning alert</div>
              <div className="alert error">Error alert</div>
              <div className="badges">
                <span className="badge info">Info</span>
                <span className="badge success">Success</span>
                <span className="badge warn">Warn</span>
                <span className="badge error">Error</span>
              </div>
            </article>
          </div>
        </section>

        {/* Tables */}
        <section id="tables" className="section">
          <h2>Tables</h2>
          <div className="grid two-up">
            <article className="card on-white">
              <table className="demo-table">
                <thead><tr><th>Header</th><th>Header</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr><td>Row 1</td><td>Copy</td><td><a href="#" className="link-on-white">Link</a> <button className="btn ghost small">Action</button></td></tr>
                  <tr><td>Row 2</td><td>Copy</td><td><a href="#" className="link-on-white">Link</a> <button className="btn ghost small">Action</button></td></tr>
                </tbody>
              </table>
            </article>
            <article className="card on-cream">
              <table className="demo-table">
                <thead><tr><th>Header</th><th>Header</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr><td>Row 1</td><td>Copy</td><td><a href="#" className="link-on-cream">Link</a> <button className="btn ghost small cream">Action</button></td></tr>
                  <tr><td>Row 2</td><td>Copy</td><td><a href="#" className="link-on-cream">Link</a> <button className="btn ghost small cream">Action</button></td></tr>
                </tbody>
              </table>
            </article>
          </div>
        </section>

        {/* Nav & Footer Mock */}
        <section id="nav-footer" className="section">
          <h2>Navigation &amp; Footer Mock</h2>
          <div className="grid two-up">
            <article className="card on-white">
              <div className="mock-nav">
                <a href="#" className="brand">Brand</a>
                <a href="#" className="link-on-white">Nav 1</a>
                <a href="#" className="link-on-white">Nav 2</a>
                <a href="#" className="link-on-white">Nav 3</a>
              </div>
              <div className="mock-footer">Footer copy • <a href="#" className="link-on-white">link</a></div>
            </article>
            <article className="card on-cream">
              <div className="mock-nav cream">
                <a href="#" className="brand">Brand</a>
                <a href="#" className="link-on-cream">Nav 1</a>
                <a href="#" className="link-on-cream">Nav 2</a>
                <a href="#" className="link-on-cream">Nav 3</a>
              </div>
              <div className="mock-footer">Footer copy • <a href="#" className="link-on-cream">link</a></div>
            </article>
          </div>
        </section>

        {/* State Matrix */}
        <section id="matrix" className="section">
          <h2>State Matrix</h2>
          <ul className="matrix">
            <li><span className="chip text-black-on-white">Aa</span> text: black/white — AA</li>
            <li><span className="chip text-black-on-cream">Aa</span> text: black/cream — AA</li>
            <li><span className="chip text-green-on-white">Aa</span> text: green/white — AAA</li>
            <li><span className="chip text-green-on-cream">Aa</span> text: green/cream — AAA</li>
            <li><span className="chip link-blue-on-white">Aa</span> link: blue/white — AA</li>
            <li><span className="chip link-bluecontrast-on-cream">Aa</span> link: blue-contrast/cream — AA</li>
            <li><span className="chip btn-white-on-blue">Aa</span> button: white/blue — AA</li>
            <li><span className="chip btn-white-on-green">Aa</span> button: white/green — AAA</li>
          </ul>
        </section>
      </main>

      <footer className="demo-foot" role="contentinfo">
        <p>This page is a demo-only style lab for palette exploration. It must not be used as a global source of truth.</p>
      </footer>

      <style jsx>{`
        /* README: local demo-only styles scoped to .heels-demo */
        .heels-demo {
          --cream: #EEE1C6;
          --blue: #0077C0;
          --blue-contrast: #0069A9;
          --green: #00471B;
          --warn: #B45309;
          --error: #B91C1C;
          --white: #FFFFFF;
          --black: #0B0B0B;

          --text-primary: var(--black);
          --text-on-blue: var(--white);
          --text-on-green: var(--white);
          --text-on-warn: var(--white);
          --text-on-error: var(--white);

          --link-on-white: var(--blue);
          --link-on-cream: var(--blue-contrast);

          --surface-page: var(--cream);
          --surface-card: var(--white);
          --border-subtle: color-mix(in srgb, var(--blue) 12%, white);

          --btn-primary-bg: var(--blue);
          --btn-primary-fg: var(--text-on-blue);
          --btn-secondary-bg: var(--green);
          --btn-secondary-fg: var(--text-on-green);

          background: var(--white);
          color: var(--text-primary);
        }
        .heels-demo[data-surface='cream'] {
          background: var(--surface-page);
        }
        .demo-banner {
          background: var(--blue);
          color: var(--text-on-blue);
          padding: 0.5rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .banner-close {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.25rem;
          cursor: pointer;
        }
        .demo-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--surface-card);
        }
        .demo-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .surface-toggle {
          margin-top: 0.5rem;
        }
        .section {
          padding: 2rem 1rem;
        }
        .grid.two-up {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .card {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 1rem;
        }
        .card.on-cream {
          background: var(--cream);
        }
        .green {
          color: var(--green);
        }
        .link-on-white {
          color: var(--link-on-white);
          text-decoration: underline;
        }
        .link-on-cream {
          color: var(--link-on-cream);
          text-decoration: underline;
        }
        .btn {
          border-radius: 6px;
          padding: 0.5rem 1rem;
          margin-right: 0.5rem;
          margin-top: 0.5rem;
          border: none;
          cursor: pointer;
          font: inherit;
        }
        .btn.primary {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-fg);
        }
        .btn.secondary {
          background: var(--btn-secondary-bg);
          color: var(--btn-secondary-fg);
        }
        .btn.ghost {
          background: transparent;
          border: 1px solid var(--blue);
          color: var(--blue);
        }
        .btn.ghost.cream {
          border-color: var(--blue-contrast);
          color: var(--blue-contrast);
        }
        .btn.small {
          padding: 0.25rem 0.5rem;
        }
        .btn.primary.hover,
        .btn.primary:hover {
          background: color-mix(in srgb, var(--blue) 85%, black);
        }
        .btn.primary.active,
        .btn.primary:active {
          background: color-mix(in srgb, var(--blue) 70%, black);
        }
        .btn.primary.focus {
          outline: 2px solid var(--blue-contrast);
          outline-offset: 2px;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-row {
          margin-top: 1rem;
        }
        .states {
          list-style: none;
          padding: 0;
        }
        .states li {
          margin-bottom: 0.5rem;
        }
        .state.default {
          color: var(--link-on-white);
        }
        .state.hover {
          color: var(--link-on-white);
          text-decoration: underline;
        }
        .state.focus {
          color: var(--link-on-white);
          outline: 2px solid var(--blue-contrast);
          outline-offset: 2px;
        }
        .state.visited {
          color: var(--green);
        }
        .state.active {
          color: color-mix(in srgb, var(--blue) 70%, black);
        }
        .state.cream {
          color: var(--link-on-cream);
        }
        .state.cream.focus {
          outline: 2px solid var(--blue-contrast);
          outline-offset: 2px;
        }
        .alert {
          padding: 0.5rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        .alert.info {
          background: var(--blue);
          color: var(--text-on-blue);
        }
        .alert.success {
          background: var(--green);
          color: var(--text-on-green);
        }
        .alert.warn {
          background: var(--warn);
          color: var(--text-on-warn);
        }
        .alert.error {
          background: var(--error);
          color: var(--text-on-error);
        }
        .badges span {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          margin-right: 0.25rem;
          margin-top: 0.25rem;
        }
        .badge.info { background: var(--blue); color: var(--text-on-blue); }
        .badge.success { background: var(--green); color: var(--text-on-green); }
        .badge.warn { background: var(--warn); color: var(--text-on-warn); }
        .badge.error { background: var(--error); color: var(--text-on-error); }
        form label {
          display: block;
          margin-bottom: 0.5rem;
        }
        form input[type='text'],
        form select,
        form textarea {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          padding: 0.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          background: var(--surface-card);
          color: var(--text-primary);
        }
        .validation .success { color: var(--green); }
        .validation .error { color: var(--error); }
        .demo-table {
          width: 100%;
          border-collapse: collapse;
        }
        .demo-table th,
        .demo-table td {
          border: 1px solid var(--border-subtle);
          padding: 0.5rem;
          text-align: left;
        }
        .mock-nav {
          display: flex;
          gap: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .mock-nav .brand {
          font-weight: bold;
        }
        .mock-footer {
          margin-top: 1rem;
          border-top: 1px solid var(--border-subtle);
          padding-top: 0.5rem;
        }
        .matrix {
          list-style: none;
          padding: 0;
          display: grid;
          gap: 0.5rem;
        }
        .chip {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: bold;
        }
        .text-black-on-white { background: var(--white); color: var(--black); }
        .text-black-on-cream { background: var(--cream); color: var(--black); }
        .text-green-on-white { background: var(--white); color: var(--green); }
        .text-green-on-cream { background: var(--cream); color: var(--green); }
        .link-blue-on-white { background: var(--white); color: var(--blue); }
        .link-bluecontrast-on-cream { background: var(--cream); color: var(--blue-contrast); }
        .btn-white-on-blue { background: var(--blue); color: var(--white); }
        .btn-white-on-green { background: var(--green); color: var(--white); }
        a:focus,
        button:focus,
        input:focus,
        select:focus,
        textarea:focus {
          outline: 2px solid var(--blue-contrast);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

