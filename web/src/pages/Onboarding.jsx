import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { DEFAULT_CATEGORIES } from '../../../shared/constants/categories.js';
import notionClient from '../../../shared/utils/notionClient.js';
import { Key, Briefcase, Target, Loader2, Plug, Link2, Save, Landmark, CheckCircle } from 'lucide-react';
import { CategoryIcon } from '../utils/categoryIcons';

const STEPS = ['welcome', 'notion', 'sidehustle', 'budget', 'done'];

export const Onboarding = () => {
  const { theme } = useTheme();
  const { setIsConfigured } = useApp();
  const c = theme.colors;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Notion setup
  const [apiKey, setApiKey] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  // Side hustle
  const [sideHustleUrl, setSideHustleUrl] = useState('');
  const [sideHustleFields, setSideHustleFields] = useState([]);
  const [amountField, setAmountField] = useState('');
  const [dateField, setDateField] = useState('');
  const [skipSideHustle, setSkipSideHustle] = useState(false);

  // Budget
  const [budgets, setBudgets] = useState(
    DEFAULT_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: '' }), {})
  );

  const extractPageId = (url) => {
    const match = url.match(/([a-f0-9]{32})/i) || url.match(/([a-f0-9-]{36})/i);
    return match ? match[1].replace(/-/g, '') : url.trim();
  };

  const handleNotionSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const pageId = extractPageId(pageUrl);
      await notionClient.verifyNotionKey(apiKey, pageId);
      await notionClient.setupDatabases({ apiKey, parentPageId: pageId });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Connection failed. Check your API key and page URL.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSideHustleFields = async () => {
    setLoading(true);
    setError('');
    try {
      const dbId = extractPageId(sideHustleUrl);
      const { fields } = await notionClient.getSideHustleFields(dbId);
      setSideHustleFields(fields);
    } catch (err) {
      setError('Could not fetch fields. Check the DB URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleSideHustleMap = async () => {
    if (!amountField || !dateField) { setError('Select both Amount and Date fields'); return; }
    setLoading(true);
    try {
      const dbId = extractPageId(sideHustleUrl);
      await notionClient.mapSideHustleDB({ dbId, amountField, dateField });
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSetup = async () => {
    setLoading(true);
    try {
      for (const [category, limit] of Object.entries(budgets)) {
        if (limit && parseFloat(limit) > 0) {
          await notionClient.upsertBudgetLimit({ category, monthlyLimit: parseFloat(limit), alertThreshold: 80 });
        }
      }
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh', background: c.background, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
  };

  const cardStyle = {
    background: c.surface, border: `1px solid ${c.cardBorder}`,
    borderRadius: 24, padding: 40, width: '100%', maxWidth: 520,
    boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 60px ${c.accentLight}`,
  };

  const inputStyle = {
    width: '100%', background: c.surfaceElevated, border: `1px solid ${c.border}`,
    borderRadius: 12, color: c.text, fontFamily: 'Inter, sans-serif',
    fontSize: 15, padding: '13px 16px', outline: 'none', marginBottom: 14,
    boxSizing: 'border-box',
  };

  const btnPrimary = {
    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
    background: c.accent, color: '#000', cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 15,
    opacity: loading ? 0.7 : 1, marginTop: 8,
  };

  const btnGhost = {
    width: '100%', padding: '12px', borderRadius: 12, border: `1px solid ${c.border}`,
    background: 'transparent', color: c.subtext, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, marginTop: 10,
  };

  // Progress indicator
  const Progress = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
      {STEPS.map((_, i) => (
        <div key={i} style={{
          width: i <= step ? 28 : 8, height: 8, borderRadius: 4,
          background: i <= step ? c.accent : c.border,
          transition: 'all 300ms ease',
        }} />
      ))}
    </div>
  );

  if (step === 0) return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Landmark size={64} color={c.accent} /></div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: c.accent, letterSpacing: '-0.02em' }}>
            Welcome to Vault
          </h1>
          <p style={{ color: c.subtext, fontSize: 16, marginTop: 12, lineHeight: 1.6 }}>
            Your personal budget planner, powered by Notion.
            <br />Let's get you set up in a few steps.
          </p>
        </div>
        <Progress />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {[
            { icon: <Key size={18} />, label: 'Connect your Notion workspace' },
            { icon: <Briefcase size={18} />, label: 'Link your side hustle database' },
            { icon: <Target size={18} />, label: 'Set your budget limits' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: c.surfaceElevated, borderRadius: 12,
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: c.text }}>{item.label}</span>
            </div>
          ))}
        </div>
        <button style={btnPrimary} onClick={() => setStep(1)}>
          Get Started →
        </button>
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <Progress />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: c.text, marginBottom: 6 }}>
          Connect Notion
        </h2>
        <p style={{ color: c.subtext, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Create a Notion integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" style={{ color: c.accent }}>notion.so/my-integrations</a>, copy the API key, and share a Notion page with it.
        </p>

        <label style={{ fontSize: 12, fontWeight: 600, color: c.subtext, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Notion API Key
        </label>
        <input
          style={inputStyle}
          placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxx"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          type="password"
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: c.subtext, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Parent Page URL
        </label>
        <input
          style={inputStyle}
          placeholder="https://notion.so/your-page-abc123"
          value={pageUrl}
          onChange={e => setPageUrl(e.target.value)}
        />

        {error && <div style={{ color: '#F44336', fontSize: 13, marginBottom: 12, background: 'rgba(244,67,54,0.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}

        <button style={btnPrimary} onClick={handleNotionSetup} disabled={loading || !apiKey || !pageUrl}>
          {loading ? <><Loader2 size={14} className="spin" /> Creating databases...</> : <><Plug size={14} /> Connect & Create Databases</>}
        </button>
      </div>
    </div>
  );

  if (step === 2) return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <Progress />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: c.text, marginBottom: 6 }}>
          Side Hustle DB
        </h2>
        <p style={{ color: c.subtext, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Connect your existing Notion database for side hustle income. We'll map the Amount and Date fields.
        </p>

        <label style={{ fontSize: 12, fontWeight: 600, color: c.subtext, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Side Hustle DB URL
        </label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input
            style={{ ...inputStyle, flex: 1, margin: 0 }}
            placeholder="https://notion.so/your-db..."
            value={sideHustleUrl}
            onChange={e => setSideHustleUrl(e.target.value)}
          />
          <button onClick={fetchSideHustleFields} disabled={!sideHustleUrl || loading} style={{
            padding: '13px 16px', borderRadius: 12, border: `1px solid ${c.cardBorder}`,
            background: c.accentLight, color: c.accent, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, flexShrink: 0,
          }}>
            Fetch Fields
          </button>
        </div>

        {sideHustleFields.length > 0 && (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.subtext, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Amount Field</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={amountField} onChange={e => setAmountField(e.target.value)}>
              <option value="">Select field...</option>
              {sideHustleFields.map(f => <option key={f.name} value={f.name}>{f.name} ({f.type})</option>)}
            </select>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.subtext, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date Field</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={dateField} onChange={e => setDateField(e.target.value)}>
              <option value="">Select field...</option>
              {sideHustleFields.map(f => <option key={f.name} value={f.name}>{f.name} ({f.type})</option>)}
            </select>
            {error && <div style={{ color: '#F44336', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button style={btnPrimary} onClick={handleSideHustleMap} disabled={loading}>
              {loading ? <><Loader2 size={14} className="spin" /> Mapping...</> : <><Link2 size={14} /> Map & Continue</>}
            </button>
          </>
        )}

        {error && !sideHustleFields.length && <div style={{ color: '#F44336', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button style={btnGhost} onClick={() => { setSkipSideHustle(true); setStep(3); }}>
          Skip for now →
        </button>
      </div>
    </div>
  );

  if (step === 3) return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <Progress />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: c.text, marginBottom: 6 }}>
          Set Budget Limits
        </h2>
        <p style={{ color: c.subtext, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Set your monthly spending limits. You can always change these later.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto' }}>
          {DEFAULT_CATEGORIES.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${cat.color}22`, border: `1px solid ${cat.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CategoryIcon id={cat.id} size={18} color={cat.color} />
              </div>
              <span style={{ flex: 1, fontSize: 14, color: c.text }}>{cat.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: c.subtext }}>₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={budgets[cat.id]}
                  onChange={e => setBudgets(b => ({ ...b, [cat.id]: e.target.value }))}
                  style={{
                    width: 100, background: c.surfaceElevated,
                    border: `1px solid ${c.border}`, borderRadius: 8,
                    color: c.text, fontFamily: 'Inter, sans-serif',
                    fontSize: 14, padding: '8px 10px', outline: 'none',
                  }}
                  min="0" step="100"
                />
              </div>
            </div>
          ))}
        </div>

        {error && <div style={{ color: '#F44336', fontSize: 13, marginTop: 12 }}>{error}</div>}

        <button style={{ ...btnPrimary, marginTop: 20 }} onClick={handleBudgetSetup} disabled={loading}>
          {loading ? <><Loader2 size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Limits & Continue</>}
        </button>
        <button style={btnGhost} onClick={() => setStep(4)}>Skip for now →</button>
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <Progress />
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}><CheckCircle size={64} color={c.accent} /></div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: c.accent, marginBottom: 12 }}>
            You're all set!
          </h2>
          <p style={{ color: c.subtext, fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Vault is connected to your Notion workspace.
            <br />Start tracking your finances now!
          </p>
          <button
            style={{ ...btnPrimary, fontSize: 16 }}
            onClick={() => setIsConfigured(true)}
          >
            Open Vault Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
