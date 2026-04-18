'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────
interface AppState {
  theme: 'light' | 'dark';
  density: 'cosy' | 'compact';
  nav: 'side' | 'top';
}
const DEFAULTS: AppState = { theme: 'light', density: 'compact', nav: 'top' };

// ── Nav structure ──────────────────────────────────────────────────────────
const NAV = [
  { group: 'Every day', items: [
    { id: 'home',     label: 'Home base',        icon: 'home'  },
    { id: 'work',     label: 'In flight',         icon: 'work'  },
    { id: 'activity', label: 'Activity',          icon: 'log'   },
  ]},
  { group: 'Customers', items: [
    { id: 'crm',      label: 'CRM',               icon: 'crm'   },
    { id: 'research', label: 'Research',          icon: 'res'   },
  ]},
  { group: 'Knowledge', items: [
    { id: 'wiki',       label: 'Wiki',            icon: 'wiki'  },
    { id: 'policies',   label: 'Policies',        icon: 'pol'   },
    { id: 'changelog',  label: 'Changelog',       icon: 'ship'  },
    { id: 'notes',      label: 'Notes & decisions', icon: 'note'},
  ]},
  { group: 'Development', items: [
    { id: 'requirements', label: 'Requirements',  icon: 'req'   },
    { id: 'uat',          label: 'UAT',           icon: 'uat'   },
  ]},
];

const ROUTE_LABELS: Record<string, string> = {
  home: 'Home base', work: 'In flight', activity: 'Activity',
  crm: 'CRM', research: 'Research', wiki: 'Wiki',
  policies: 'Policies & legal', changelog: 'Changelog',
  notes: 'Notes & decisions', requirements: 'Requirements', uat: 'UAT',
};

// ── Static seed data (until DB has real content) ───────────────────────────
const KPIS = [
  { l: 'Waitlist',    v: '847',  small: 'trades', delta: '↑ 34 this week',  cls: 'up' },
  { l: 'Quotes sent', v: '2.4k', small: '',       delta: '↑ 18% MoM',       cls: 'up' },
  { l: 'Win rate',    v: '64',   small: '%',      delta: '↓ 2pts last 30d', cls: 'dn' },
  { l: 'Avg quote',   v: '$840', small: '',       delta: '↑ $40 vs prev qtr',cls: 'up'},
];
const ISSUES = [
  { id: 'REL-142', title: 'Voice capture drops last second on iOS 18', status: 'prog',   prio: 'urgent', who: 'J', project: 'iOS app · v0.9' },
  { id: 'REL-139', title: 'Auto-chase email lands in spam — SPF record', status: 'review', prio: 'high', who: 'M', project: 'Backend' },
  { id: 'REL-136', title: 'Quote PDF — line items overflow on long jobs', status: 'prog',  prio: 'high', who: 'J', project: 'iOS app · v0.9' },
  { id: 'REL-131', title: 'Onboarding step 3 — ABN lookup timeout',      status: 'todo',  prio: 'med',  who: 'S', project: 'iOS app · v0.9' },
  { id: 'REL-128', title: 'Admin: export waitlist to CSV',                status: 'done',  prio: 'low',  who: 'M', project: 'Web' },
  { id: 'REL-127', title: 'Dark mode — slate backgrounds clash on Samsung',status: 'todo', prio: 'med',  who: 'S', project: 'iOS app · v0.9' },
  { id: 'REL-125', title: 'Materials list — price rounding off by $0.01', status: 'review',prio: 'high', who: 'J', project: 'iOS app · v0.9' },
  { id: 'REL-120', title: 'Push notification not firing on quote accept', status: 'block', prio: 'urgent',who: 'M', project: 'Backend' },
];
const ACTIVITY = [
  { when: '14m ago',   who: 'James', what: 'shipped',   ref: 'REL-134', extra: ' — Postman collection for /v1/estimates' },
  { when: '1h ago',    who: 'Mia',   what: 'opened PR for', ref: 'REL-139', extra: ' SPF fix' },
  { when: '2h ago',    who: 'Sam',   what: 'closed',    ref: 'REL-128', extra: ' — CSV export live on admin' },
  { when: '3h ago',    who: 'James', what: 'commented on', ref: 'REL-142', extra: '' },
  { when: 'Yesterday', who: 'Mia',   what: 'deployed',  ref: 'v0.8.4', extra: ' to production' },
];
const CHANGELOG = [
  { date: '17 Apr', v: 'v0.9.0', title: 'iOS app <em>beta</em> opens', tags: ['ship'], body: 'TestFlight now open to 200 waitlist trades. Voice capture redesigned. Quote PDF v2 with itemised labour.' },
  { date: '2 Apr',  v: 'v0.8.4', title: 'Auto-chase <em>goes live</em>', tags: ['ship','fix'], body: 'Automated follow-up emails at day 2, day 5. Fixed SPF record. Win rate up 8pts.' },
  { date: '18 Mar', v: 'v0.8.0', title: 'Materials list <em>rewrite</em>', tags: ['ship','brand'], body: 'New price-lookup engine covers 4,200 SKUs. Brand refresh — Sentient typeface, navy palette.' },
];
const WIKI_SECTIONS = [
  { n: 'I',   id: 'writing',  title: 'How we write',  sub: 'The house style. Short wins.',              pages: '12 pages' },
  { n: 'II',  id: 'stack',    title: 'The stack',      sub: 'Flutter, Next.js, Supabase, Cloudflare.',  pages: '8 pages'  },
  { n: 'III', id: 'runbooks', title: 'Runbooks',       sub: 'Deploy, roll back, don\'t wake anyone up.',pages: '6 pages'  },
  { n: 'IV',  id: 'brand',    title: 'Brand system',   sub: 'Colours, type, the stamp, the voice.',     pages: '18 pages' },
  { n: 'V',   id: 'security', title: 'Security',       sub: 'Access, secrets, incident response.',      pages: '9 pages'  },
  { n: 'VI',  id: 'trades',   title: 'Trade vocab',    sub: 'Sparky, chippy, plumber.',                 pages: '14 pages' },
];
const POLICIES = [
  { n: 'I',   id: 'tos',     title: 'Terms of Service',        sub: 'How Relia and users agree to play.', version: 'v1.3', updated: '12 Apr' },
  { n: 'II',  id: 'privacy', title: 'Privacy Policy',          sub: 'What we collect and why.',           version: 'v2.1', updated: '1 Mar'  },
  { n: 'III', id: 'aup',     title: 'Acceptable Use',          sub: "What the platform isn't for.",        version: 'v1.0', updated: '15 Jan' },
  { n: 'IV',  id: 'sla',     title: 'Service Level Agreement', sub: 'Uptime commitments and remedies.',   version: 'v1.1', updated: '20 Feb' },
];
const RESEARCH = [
  { who: 'Brendan · plumber · Geelong', date: '16 APR', q: 'The auto-chase bit is the <em>killer feature</em>. My old system needed me to do that manually.', score: 9 },
  { who: 'Dani · electrician · Melb',   date: '14 APR', q: 'Voice capture is unreal but it messed up "downlights" twice. I had to fix it.',                   score: 7 },
  { who: 'Kev · tiler · Brisbane',      date: '11 APR', q: 'Fastest quote I\'ve ever sent. Customer called me back in 10 minutes.',                           score: 10},
  { who: 'Sue · builder · Sydney',      date: '9 APR',  q: 'Pricing is fine. ABN lookup saved me a step I always forget.',                                    score: 8 },
];
const NOTES_DATA = [
  { date: '17 APR', title: 'Standup — Tues',   tags: ['weekly','internal'], body: 'Focus: iOS TestFlight goes wide. Voice drop bug REL-142 is P0.' },
  { date: '15 APR', title: 'Pricing decision', tags: ['decision','pricing'], body: 'Keeping $19/mo solo tier. No freemium — support cost too high.' },
  { date: '12 APR', title: 'Design retro',     tags: ['design','brand'],    body: 'New Sentient type landing well in beta.' },
];
const REQUIREMENTS_DATA = [
  { ref: 'FR-001', type: 'functional',     category: 'Voice Capture',  priority: 'must_have',    status: 'implemented', title: 'Voice-to-quote in under 60s' },
  { ref: 'FR-002', type: 'functional',     category: 'Quoting',        priority: 'must_have',    status: 'implemented', title: 'Auto-generate compliant PDF quote' },
  { ref: 'FR-003', type: 'functional',     category: 'Follow-up',      priority: 'must_have',    status: 'approved',    title: 'Automated chase emails at day 2 and day 5' },
  { ref: 'FR-004', type: 'functional',     category: 'Onboarding',     priority: 'must_have',    status: 'implemented', title: 'ABN lookup and validation' },
  { ref: 'FR-005', type: 'functional',     category: 'Materials',      priority: 'should_have',  status: 'approved',    title: 'Price lookup for 4,200+ SKUs' },
  { ref: 'NFR-001', type: 'non_functional', category: 'Performance',    priority: 'must_have',    status: 'implemented', title: 'App loads in under 2s on 4G' },
  { ref: 'NFR-002', type: 'non_functional', category: 'Security',       priority: 'must_have',    status: 'approved',    title: 'All data encrypted at rest and in transit' },
  { ref: 'NFR-003', type: 'non_functional', category: 'Availability',   priority: 'should_have',  status: 'draft',       title: '99.5% uptime SLA' },
];
const UAT_DATA = [
  { ref: 'UAT-001', req: 'FR-001', title: 'Voice capture — basic plumbing job', status: 'passed',      tester: 'James', date: '15 Apr' },
  { ref: 'UAT-002', req: 'FR-001', title: 'Voice capture — electrical with downlights', status: 'failed', tester: 'Mia', date: '14 Apr' },
  { ref: 'UAT-003', req: 'FR-002', title: 'PDF quote renders on iOS 18', status: 'in_progress', tester: 'Sam',   date: '17 Apr' },
  { ref: 'UAT-004', req: 'FR-003', title: 'Chase email delivered — not spam', status: 'passed',   tester: 'Mia',   date: '10 Apr' },
  { ref: 'UAT-005', req: 'FR-004', title: 'ABN lookup — valid ABN',      status: 'passed',       tester: 'James', date: '8 Apr'  },
  { ref: 'UAT-006', req: 'NFR-001','title': 'Load time on Telstra 4G',   status: 'draft',        tester: '',      date: ''       },
];
const CRM_CONTACTS = [
  { id: '1', name: 'Brendan Walsh',  type: 'tradie',       trade: 'Plumber',      company: 'Walsh Plumbing',    status: 'active',   location: 'Geelong VIC',  email: 'brendan@walshplumbing.com.au' },
  { id: '2', name: 'Dani Nguyen',    type: 'tradie',       trade: 'Electrician',  company: 'Nguyen Electrical', status: 'active',   location: 'Melbourne VIC', email: 'dani@nguyenelec.com.au' },
  { id: '3', name: 'Kevin Morris',   type: 'tradie',       trade: 'Tiler',        company: 'Morris Tiling',     status: 'active',   location: 'Brisbane QLD',  email: 'kev@morristiling.com.au' },
  { id: '4', name: 'Sue Cartwright', type: 'tradie',       trade: 'Builder',      company: 'Cartwright Build',  status: 'prospect', location: 'Sydney NSW',    email: 'sue@cartwrightbuild.com.au' },
  { id: '5', name: 'Sarah Okafor',   type: 'end_customer', trade: '',             company: 'Okafor Properties', status: 'active',   location: 'Melbourne VIC', email: 'sarah@okaforprop.com.au' },
  { id: '6', name: 'Tom Reid',       type: 'end_customer', trade: '',             company: '',                  status: 'active',   location: 'Brisbane QLD',  email: 'tom.reid@gmail.com' },
];

// ── Inline editable field ─────────────────────────────────────────────────
function EditableField({ value, onSave, multiline = false, className = '' }: {
  value: string; onSave: (v: string) => void; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };

  if (!editing) return (
    <span className={`editable-field ${className}`} onClick={() => setEditing(true)} title="Click to edit">
      {value || <span style={{ color: 'var(--fg3)', fontStyle: 'italic' }}>—</span>}
    </span>
  );

  return multiline
    ? <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} className={`editable-input ${className}`} value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} />
    : <input ref={ref as React.RefObject<HTMLInputElement>} className={`editable-input ${className}`} value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} />;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'home':    return <svg {...p}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
    case 'work':    return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
    case 'log':     return <svg {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>;
    case 'crm':     return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
    case 'wiki':    return <svg {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
    case 'pol':     return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'ship':    return <svg {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg>;
    case 'res':     return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'note':    return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    case 'req':     return <svg {...p}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
    case 'uat':     return <svg {...p}><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"/></svg>;
    case 'settings':return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case 'plus':    return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'edit':    return <svg {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    default:        return <svg {...p}><circle cx="12" cy="12" r="2"/></svg>;
  }
}

// ── Status pills ──────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = { todo: 'To do', prog: 'In progress', review: 'In review', done: 'Done', block: 'Blocked' };
function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill s-${status}`}><span className="d" />{STATUS_LABELS[status] ?? status}</span>;
}

// ── Issue row ─────────────────────────────────────────────────────────────
function IssueRow({ issue }: { issue: typeof ISSUES[0] }) {
  return (
    <div className="issue">
      <span className="id">{issue.id}</span>
      <span className="ttl"><b>{issue.title}</b>{issue.project && <span className="sub">{issue.project}</span>}</span>
      <span className={`assignee ${issue.who.toLowerCase()}`}>{issue.who}</span>
      <StatusPill status={issue.status} />
    </div>
  );
}

// ── Views ──────────────────────────────────────────────────────────────────
function HomeView() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  const [,day, ...rest] = dateStr.split(/,?\s+/);
  return (
    <>
      <div className="hero">
        <h1 className="h-display">Good to have you back.<br /><em>What&rsquo;s on today?</em></h1>
        <div className="hero-meta">
          {KPIS.slice(0,3).map(k => (
            <div className="item" key={k.l}>
              <span className="v">{k.v}{k.small && <small style={{fontFamily:'var(--font-body)',fontSize:14,color:'var(--fg3)',marginLeft:4}}>{k.small}</small>}</span>
              <span className="l">{k.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="kpi-grid" style={{marginBottom:'var(--section-gap)'}}>
        {KPIS.map(k => (
          <div className="kpi" key={k.l}>
            <div className="l">{k.l}</div>
            <div className="v">{k.v}{k.small && <small>{k.small}</small>}</div>
            <div className={`delta ${k.cls}`}>{k.delta}</div>
          </div>
        ))}
      </div>
      <div className="grid-dash">
        <div className="block">
          <div className="block-hd"><h3>In flight</h3><button className="chev" onClick={() => window.location.hash='/work'}>See all →</button></div>
          <div className="block-body tight">{ISSUES.filter(i => i.status !== 'done').slice(0,4).map(i => <IssueRow key={i.id} issue={i} />)}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div className="block">
            <div className="block-hd"><h3>Today</h3><span className="aside">{dateStr.split(',')[0]}</span></div>
            <div className="today">
              <div className="date">{now.toLocaleDateString('en-AU',{day:'numeric',month:'long'})}</div>
              <span className="subdate">Week {Math.ceil(now.getDate()/7)} · Q2</span>
              <div className="focus"><span className="tag">Focus</span>iOS TestFlight goes wide. Voice drop is P0.</div>
              <ul className="check">
                <li className="done"><span className="box" /><span>Ship v0.9.0 to TestFlight</span></li>
                <li><span className="box" /><span>Fix REL-142 voice drop</span></li>
                <li><span className="box" /><span>SPF record — Mia to confirm</span></li>
                <li className="done"><span className="box" /><span>Waitlist email batch 4</span></li>
              </ul>
            </div>
          </div>
          <div className="block">
            <div className="block-hd"><h3>Activity</h3><button className="chev" onClick={() => window.location.hash='/activity'}>All →</button></div>
            <div className="feed">
              {ACTIVITY.slice(0,4).map((a,i) => (
                <div className="feed-item" key={i}>
                  <span className="when">{a.when}</span>
                  <span><span className="who">{a.who}</span> <span className="what">{a.what} </span><span className="ref">{a.ref}</span><span className="what">{a.extra}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function WorkView() {
  const [filter, setFilter] = useState('all');
  const [liveIssues, setLiveIssues] = useState<typeof ISSUES | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('linear_issues').select('*').order('priority').then(({ data }) => {
      if (data && data.length > 0) {
        setLiveIssues(data.map(d => ({
          id: d.identifier,
          title: d.title,
          status: d.status === 'in_progress' ? 'prog' : d.status === 'in_review' ? 'review' : d.status === 'cancelled' ? 'block' : d.status,
          prio: d.priority === 1 ? 'urgent' : d.priority === 2 ? 'high' : d.priority === 3 ? 'med' : 'low',
          who: d.assignee_id ? 'J' : '—',
          project: d.project ?? '',
        })));
      }
      setLoading(false);
    });
  }, []);

  const issues = liveIssues ?? ISSUES;
  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);

  return (
    <>
      <div className="section-hd">
        <h2>In <em>flight</em></h2>
        <span className="aside">{loading ? 'syncing…' : `${issues.length} issues${liveIssues ? ' · live' : ' · cached'}`}</span>
      </div>
      <div className="work-filters">
        {['all','prog','review','todo','block','done'].map(f => (
          <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f)}>
            {f==='all'?'All':STATUS_LABELS[f]}
          </button>
        ))}
      </div>
      <div className="block">
        <div className="block-body tight">
          {filtered.map(i => <IssueRow key={i.id} issue={i} />)}
          {filtered.length === 0 && <div style={{padding:'var(--card-pad)',color:'var(--fg3)',fontSize:13}}>Nothing here. Good.</div>}
        </div>
      </div>
    </>
  );
}

function ActivityView() {
  return (
    <>
      <div className="section-hd"><h2>Activity</h2><span className="aside">Last 48 hours</span></div>
      <div className="block">
        <div className="feed">
          {ACTIVITY.map((a,i) => (
            <div className="feed-item" key={i}>
              <span className="when">{a.when}</span>
              <span><span className="who">{a.who}</span> <span className="what">{a.what} </span><span className="ref">{a.ref}</span><span className="what">{a.extra}</span></span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CRMView() {
  const [tab, setTab] = useState<'tradies'|'customers'>('tradies');
  const [contacts, setContacts] = useState(CRM_CONTACTS);
  const tradies   = contacts.filter(c => c.type === 'tradie');
  const customers = contacts.filter(c => c.type === 'end_customer');
  const shown = tab === 'tradies' ? tradies : customers;

  const update = (id: string, field: string, val: string) => {
    setContacts(cs => cs.map(c => c.id === id ? {...c, [field]: val} : c));
    // TODO: persist to supabase contacts table
  };

  return (
    <>
      <div className="section-hd">
        <h2>CRM</h2>
        <button className="btn" style={{fontSize:12,padding:'5px 12px'}}><Icon name="plus" size={12} /> Add contact</button>
      </div>
      <div className="crm-tabs">
        <button className={`filter-btn${tab==='tradies'?' active':''}`} onClick={() => setTab('tradies')}>Tradies ({tradies.length})</button>
        <button className={`filter-btn${tab==='customers'?' active':''}`} onClick={() => setTab('customers')}>End customers ({customers.length})</button>
      </div>
      <div className="block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              {tab==='tradies' && <th>Trade</th>}
              <th>Company</th>
              <th>Email</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(c => (
              <tr key={c.id}>
                <td><EditableField value={c.name}    onSave={v => update(c.id,'name',v)}    className="fw-600" /></td>
                {tab==='tradies' && <td><EditableField value={c.trade}   onSave={v => update(c.id,'trade',v)} /></td>}
                <td><EditableField value={c.company} onSave={v => update(c.id,'company',v)} /></td>
                <td><EditableField value={c.email}   onSave={v => update(c.id,'email',v)}   /></td>
                <td><EditableField value={c.location} onSave={v => update(c.id,'location',v)} /></td>
                <td><span className={`status-pill ${c.status==='active'?'s-done':c.status==='prospect'?'s-todo':'s-block'}`}><span className="d"/>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WikiView() {
  return (
    <>
      <div className="section-hd"><h2>Wiki</h2><span className="aside">{WIKI_SECTIONS.length} sections</span></div>
      <div className="wiki-grid">
        {WIKI_SECTIONS.map(w => (
          <div key={w.id} className="wiki-card">
            <div className="num">{w.n}</div>
            <h4>{w.title}</h4>
            <p>{w.sub}</p>
            <div className="pages">{w.pages}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function PoliciesView() {
  return (
    <>
      <div className="section-hd"><h2>Policies <em>&amp; legal</em></h2></div>
      <div className="block">
        <div className="block-body tight">
          {POLICIES.map(p => (
            <div key={p.id} className="policy-row">
              <span className="n">{p.n}</span>
              <div className="meta"><h4>{p.title}</h4><p>{p.sub}</p></div>
              <div className="version"><b>{p.version}</b>{p.updated}</div>
              <span className="arrow">→</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ChangelogView() {
  return (
    <>
      <div className="section-hd"><h2>Changelog</h2><span className="aside">What shipped</span></div>
      {CHANGELOG.map((c,i) => (
        <div className="log-item" key={i}>
          <div className="when">{c.date}<span className="v">{c.v}</span></div>
          <div>
            <h3 className="t" dangerouslySetInnerHTML={{__html: c.title}} />
            <p>{c.body}</p>
            <div className="tags">{c.tags.map(t => <span key={t} className={`tag t-${t}`}>{t}</span>)}</div>
          </div>
        </div>
      ))}
    </>
  );
}

function ResearchView() {
  return (
    <>
      <div className="section-hd"><h2>Research</h2><span className="aside">{RESEARCH.length} interviews</span></div>
      <div className="research-grid">
        {RESEARCH.map((r,i) => (
          <div key={i} className="quote-card">
            <p className="q" dangerouslySetInnerHTML={{__html:`"${r.q}"`}} />
            <div className="src">
              <div className="who">{r.who.split(' · ')[0]}<small>{r.who.split(' · ').slice(1).join(' · ')}</small></div>
              <div className="score">{r.score}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function NotesView() {
  const [notes, setNotes] = useState(NOTES_DATA);
  const update = (i: number, field: string, val: string) => {
    setNotes(ns => ns.map((n,j) => j===i ? {...n,[field]:val} : n));
  };
  return (
    <>
      <div className="section-hd">
        <h2>Notes <em>&amp; decisions</em></h2>
        <button className="btn" style={{fontSize:12,padding:'5px 12px'}}><Icon name="plus" size={12} /> Add note</button>
      </div>
      <div className="notes-grid">
        {notes.map((n,i) => (
          <div key={i} className="note-card">
            <div className="head">
              <EditableField value={n.title} onSave={v => update(i,'title',v)} className="note-title" />
              <span className="date">{n.date}</span>
            </div>
            <EditableField value={n.body} onSave={v => update(i,'body',v)} multiline className="note-body" />
            <div className="pills">{n.tags.map(t => <span key={t}>{t}</span>)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function RequirementsView() {
  const [reqs, setReqs] = useState(REQUIREMENTS_DATA);
  const [filter, setFilter] = useState<'all'|'functional'|'non_functional'>('all');
  const shown = filter === 'all' ? reqs : reqs.filter(r => r.type === filter);
  const update = (ref: string, field: string, val: string) => {
    setReqs(rs => rs.map(r => r.ref===ref ? {...r,[field]:val} : r));
  };
  const priorityClass: Record<string,string> = { must_have:'s-block', should_have:'s-prog', could_have:'s-review', wont_have:'s-todo' };
  const statusClass: Record<string,string> = { draft:'s-todo', approved:'s-review', implemented:'s-done', deprecated:'s-block' };
  return (
    <>
      <div className="section-hd"><h2>Requirements</h2><span className="aside">{reqs.length} total</span></div>
      <div className="work-filters">
        {['all','functional','non_functional'].map(f => (
          <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f as typeof filter)}>
            {f==='all'?'All':f==='functional'?'Functional':'Non-functional'}
          </button>
        ))}
      </div>
      <div className="block">
        <table className="data-table">
          <thead><tr><th>Ref</th><th>Category</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.ref}>
                <td><span className="mono">{r.ref}</span></td>
                <td><EditableField value={r.category} onSave={v => update(r.ref,'category',v)} /></td>
                <td><EditableField value={r.title}    onSave={v => update(r.ref,'title',v)} className="fw-600" /></td>
                <td><span className={`status-pill ${priorityClass[r.priority]}`}><span className="d"/>{r.priority.replace('_',' ')}</span></td>
                <td><span className={`status-pill ${statusClass[r.status]}`}><span className="d"/>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UATView() {
  const [tests, setTests] = useState(UAT_DATA);
  const statusClass: Record<string,string> = { draft:'s-todo', ready:'s-todo', in_progress:'s-prog', passed:'s-done', failed:'s-block', blocked:'s-block' };
  const update = (ref: string, field: string, val: string) => {
    setTests(ts => ts.map(t => t.ref===ref ? {...t,[field]:val} : t));
  };
  return (
    <>
      <div className="section-hd"><h2>User acceptance <em>testing</em></h2><span className="aside">{tests.length} tests</span></div>
      <div className="uat-summary">
        {(['passed','failed','in_progress','draft'] as const).map(s => (
          <div className="kpi" key={s} style={{borderRadius:'var(--radius-lg)',border:'1px solid var(--border)'}}>
            <div className="l">{s.replace('_',' ')}</div>
            <div className="v" style={{fontStyle:'normal',fontFamily:'var(--font-body)',fontWeight:600,fontSize:32}}>{tests.filter(t=>t.status===s).length}</div>
          </div>
        ))}
      </div>
      <div className="block" style={{marginTop:24}}>
        <table className="data-table">
          <thead><tr><th>Ref</th><th>Requirement</th><th>Test</th><th>Tester</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.ref}>
                <td><span className="mono">{t.ref}</span></td>
                <td><span className="mono" style={{color:'var(--fg3)'}}>{t.req}</span></td>
                <td><EditableField value={t.title} onSave={v => update(t.ref,'title',v)} className="fw-600" /></td>
                <td><EditableField value={t.tester} onSave={v => update(t.ref,'tester',v)} /></td>
                <td><span style={{color:'var(--fg3)',fontSize:11,fontFamily:'var(--font-mono)'}}>{t.date}</span></td>
                <td><span className={`status-pill ${statusClass[t.status]}`}><span className="d"/>{t.status.replace('_',' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [appState, setAppState] = useState<AppState>(DEFAULTS);
  const [route, setRoute] = useState('home');
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('relia-hq');
    if (saved) { try { setAppState(JSON.parse(saved)); } catch {} }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.body.classList.toggle('theme-dark', appState.theme === 'dark');
    document.body.classList.toggle('density-compact', appState.density === 'compact');
  }, [appState.theme, appState.density, hydrated]);

  useEffect(() => {
    const handle = () => { const h = window.location.hash.replace('#/','') || 'home'; setRoute(h); window.scrollTo(0,0); };
    window.addEventListener('hashchange', handle);
    handle();
    return () => window.removeEventListener('hashchange', handle);
  }, []);

  const update = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    const next = {...appState, [key]: value};
    setAppState(next);
    localStorage.setItem('relia-hq', JSON.stringify(next));
  };

  const navigate = (id: string) => { window.location.hash = `/${id}`; };
  const topRoute = (route.split('/')[0] ?? 'home') as string;
  const label = ROUTE_LABELS[route] ?? ROUTE_LABELS[topRoute] ?? 'Home base';

  const renderView = () => {
    switch (topRoute) {
      case 'home':         return <HomeView />;
      case 'work':         return <WorkView />;
      case 'activity':     return <ActivityView />;
      case 'crm':          return <CRMView />;
      case 'wiki':         return <WikiView />;
      case 'policies':     return <PoliciesView />;
      case 'changelog':    return <ChangelogView />;
      case 'research':     return <ResearchView />;
      case 'notes':        return <NotesView />;
      case 'requirements': return <RequirementsView />;
      case 'uat':          return <UATView />;
      default:             return <HomeView />;
    }
  };

  return (
    <div className={`app${appState.nav==='top'?' nav-top':''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <button className="sb-brand" onClick={() => navigate('home')} style={{background:'none',border:'none',cursor:'pointer',textAlign:'left',width:'100%'}}>
          <img src="/assets/relia_logo_mark.png" alt="Relia" />
          <div><div className="name">Relia</div><div className="sub">home base</div></div>
        </button>
        {NAV.map(group => (
          <div className="sb-group" key={group.group}>
            <span className="sb-group-label">{group.group}</span>
            {group.items.map(item => (
              <button key={item.id} className={`sb-link${topRoute===item.id?' active':''}`} onClick={() => navigate(item.id)}>
                <Icon name={item.icon} />{item.label}<span className="dot" />
              </button>
            ))}
          </div>
        ))}
        <div className="sb-foot"><span className="avatar">A</span><span>Anon</span></div>
      </aside>

      <div className="main">
        {/* Top nav */}
        <nav className="topnav">
          <button className="tn-brand" onClick={() => navigate('home')} style={{background:'none',border:'none',cursor:'pointer'}}>
            <img src="/assets/relia_logo_mark.png" alt="Relia" />
            <span>Relia</span>
          </button>
          {NAV.flatMap(g => g.items).map(item => (
            <button key={item.id} className={`tn-link${topRoute===item.id?' active':''}`} onClick={() => navigate(item.id)}>{item.label}</button>
          ))}
          <div className="tn-spacer" />
          <div className="tn-avatar">A</div>
        </nav>

        {/* Topbar */}
        <header className="topbar">
          <span className="crumb">Relia · <b>{label}</b></span>
          <div className="spacer" />
          <div className="search-wrap"><input className="search-box" type="text" placeholder="Search…" /></div>
          <span className="shortcut">⌘K</span>
          <button className="tweaks-btn" onClick={() => setTweaksOpen(o => !o)}><Icon name="settings" size={15} /></button>
          <button className="btn"><Icon name="plus" size={13} />New</button>
        </header>

        <div className="rail">
          <div className="rail-label">{topRoute.toUpperCase()}</div>
          <div className="rail-content">{renderView()}</div>
        </div>
      </div>

      <div className="stamp-wm">R</div>

      {tweaksOpen && (
        <div className="tweaks-panel">
          <h4>Display <em>settings</em></h4>
          <div className="tw-row"><span className="lab">Theme</span>
            <div className="seg">
              <button className={appState.theme==='light'?'on':''} onClick={() => update('theme','light')}>Light</button>
              <button className={appState.theme==='dark'?'on':''} onClick={() => update('theme','dark')}>Dark</button>
            </div>
          </div>
          <div className="tw-row"><span className="lab">Density</span>
            <div className="seg">
              <button className={appState.density==='cosy'?'on':''} onClick={() => update('density','cosy')}>Cosy</button>
              <button className={appState.density==='compact'?'on':''} onClick={() => update('density','compact')}>Compact</button>
            </div>
          </div>
          <div className="tw-row"><span className="lab">Navigation</span>
            <div className="seg">
              <button className={appState.nav==='side'?'on':''} onClick={() => update('nav','side')}>Side</button>
              <button className={appState.nav==='top'?'on':''} onClick={() => update('nav','top')}>Top</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
