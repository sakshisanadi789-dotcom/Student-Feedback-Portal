import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, ChevronDown, GraduationCap, LayoutDashboard, LogOut, Menu, MessageCircleQuestion, MessageSquareText, PanelsTopLeft, Settings2, UsersRound, X } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import ResourcePage from './components/ResourcePage.jsx';
import StudentFeedback from './components/StudentFeedback.jsx';
import { api } from './services/api.js';

const navigation = [
  { section: 'Overview', items: [{ key: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] }, { key: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager', 'teacher'] }] },
  { section: 'Your learning', items: [{ key: 'my-feedback', label: 'Course feedback', icon: MessageSquareText, roles: ['student'] }] },
  { section: 'Academic', items: [{ key: 'students', label: 'Students', icon: GraduationCap, roles: ['admin', 'manager', 'staff'] }, { key: 'teachers', label: 'Teachers', icon: UsersRound, roles: ['admin', 'manager', 'staff'] }, { key: 'courses', label: 'Courses', icon: BookOpen, roles: ['admin', 'manager', 'staff'] }, { key: 'subjects', label: 'Subjects', icon: PanelsTopLeft, roles: ['admin', 'manager', 'staff'] }] },
  { section: 'Feedback', items: [{ key: 'feedback-forms', label: 'Feedback forms', icon: MessageSquareText, roles: ['admin', 'manager', 'staff', 'teacher'] }, { key: 'feedback-questions', label: 'Question library', icon: MessageCircleQuestion, roles: ['admin', 'manager', 'staff'] }, { key: 'feedback-responses', label: 'Responses', icon: MessageSquareText, roles: ['admin', 'manager', 'staff', 'teacher'] }] },
  { section: 'Administration', items: [{ key: 'users', label: 'Users', icon: UsersRound, roles: ['admin'] }, { key: 'roles', label: 'Roles', icon: Settings2, roles: ['admin'] }] },
];

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try { await onLogin(email, password); } catch (loginError) { setError(loginError.message); } finally { setLoading(false); }
  }

  return <main className="login-screen"><section className="login-story"><div className="brand-lockup"><span className="brand-symbol">f.</span><span>fieldnote<small>STUDENT FEEDBACK PORTAL</small></span></div><div className="story-copy"><p className="eyebrow">A better campus starts by listening.</p><h1>Make every<br /><em>voice</em> count.</h1><p>Thoughtful feedback helps great teaching grow. See what your community is telling you, all in one place.</p></div><div className="story-bottom"><span className="story-mark">01 / 03</span><div className="story-lines"><i /><i /><i /></div><span>Northstar University</span></div><div className="story-illustration" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-center"><MessageSquareText size={37} strokeWidth={1.2} /></div><span className="orbit-label label-one">listen closely</span><span className="orbit-label label-two">learn together</span><span className="orbit-spark">✳</span></div></section><section className="login-side"><div className="login-card"><p className="eyebrow">Welcome back</p><h2>Sign in to your workspace</h2><p className="login-intro">Use your university account to continue.</p><form onSubmit={submit}><label className="field"><span>Email address</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <div className="inline-error" role="alert">{error}</div>}<button className="button button-primary login-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}<span aria-hidden="true">→</span></button></form><div className="demo-hint"><span className="demo-dot" /><span>Local demo login details are listed in the project README.</span></div><p className="login-privacy">Student feedback is anonymous to teaching staff.<br />Your workspace is protected by role-based access.</p></div><footer>© 2026 Northstar University <span>•</span> Academic Services</footer></section></main>;
}

function AppShell({ user, onLogout }) {
  const [active, setActive] = useState(user.role === 'student' ? 'my-feedback' : 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const title = active === 'dashboard' ? 'Overview' : active === 'reports' ? 'Reports' : active === 'feedback-questions' ? 'Question library' : active === 'my-feedback' ? 'Course feedback' : active.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
  const canWrite = ['admin', 'manager'].includes(user.role);

  return <div className="app-shell"><aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><span className="brand-symbol">f.</span><span>fieldnote<small>STUDENT FEEDBACK</small></span><button className="sidebar-close icon-button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={17} /></button></div><div className="workspace-switch"><div className="workspace-avatar">N</div><span>Northstar University<small>Academic workspace</small></span><ChevronDown size={15} /></div><nav className="sidebar-nav">{navigation.map((group) => { const items = group.items.filter((item) => item.roles.includes(user.role)); return items.length ? <div className="nav-group" key={group.section}><p>{group.section}</p>{items.map(({ key, label, icon: Icon }) => <button key={key} className={`nav-link ${active === key ? 'nav-active' : ''}`} onClick={() => { setActive(key); setSidebarOpen(false); }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{key === 'feedback-responses' && <i className="nav-counter">new</i>}</button>)}</div> : null; })}</nav><div className="sidebar-bottom"><div className="semester-card"><span className="semester-mark"><BookOpen size={17} /></span><span>Spring semester<small>2026 · Week 08 of 14</small></span><span className="semester-live" /></div><div className="sidebar-user"><span className="user-avatar">{user.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="sidebar-user-copy">{user.full_name}<small>{user.role}</small></span><button className="icon-button logout-button" aria-label="Sign out" title="Sign out" onClick={onLogout}><LogOut size={16} /></button></div></div></aside>{sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main className="main-area"><header className="topbar"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><i>/</i><strong>{title}</strong></div><div className="topbar-right"><span className="term-label">Spring 2026</span><span className="topbar-divider" /><button className="topbar-profile" onClick={() => setProfileOpen((open) => !open)}><span className="user-avatar small-avatar">{user.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span>{user.full_name.split(' ')[0]}</span><ChevronDown size={14} /></button>{profileOpen && <div className="profile-menu"><span>{user.email}</span><button onClick={onLogout}><LogOut size={15} /> Sign out</button></div>}</div></header><div className="content-area">{active === 'dashboard' ? <Dashboard user={user} onNavigate={setActive} /> : active === 'my-feedback' ? <StudentFeedback user={user} /> : active === 'reports' ? <ReportsPage /> : <ResourcePage key={active} resource={active} canWrite={canWrite} />}</div></main></div>;
}

function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('/reports/feedback').then((response) => setRows(response.data || [])).catch((requestError) => setError(requestError.message)); }, []);
  return <section className="resource-page"><div className="page-heading"><div><p className="eyebrow">Workspace / Reports</p><h1>Feedback reports</h1><p>Compare response volume and average ratings across teaching, subjects, and courses.</p></div><span className="report-period">Spring 2026</span></div>{error && <div className="inline-error">{error}</div>}<div className="table-frame"><div className="table-scroll"><table><thead><tr><th>Teacher</th><th>Subject</th><th>Course</th><th>Responses</th><th>Average rating</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.teacher}-${row.subject}-${index}`}><td>{row.teacher}</td><td>{row.subject}</td><td>{row.course}</td><td>{row.responses}</td><td><span className="rating-cell">★ {row.average_rating ? Number(row.average_rating).toFixed(2) : '—'}</span></td></tr>)}</tbody></table>{rows.length === 0 && !error && <div className="table-state"><strong>No report data yet</strong><span>Ratings appear when students submit feedback.</span></div>}</div></div></section>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('feedback-token')));

  useEffect(() => {
    if (!localStorage.getItem('feedback-token')) return;
    api('/auth/me').then((response) => setUser(response.data)).catch(() => localStorage.removeItem('feedback-token')).finally(() => setChecking(false));
  }, []);

  async function login(email, password) {
    const response = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('feedback-token', response.data.token);
    setUser(response.data.user);
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* Local session still clears if the API is offline. */ }
    localStorage.removeItem('feedback-token');
    setUser(null);
  }

  if (checking) return <div className="boot-screen"><span className="brand-symbol">f.</span><span>Preparing your workspace...</span></div>;
  return user ? <AppShell user={user} onLogout={logout} /> : <Login onLogin={login} />;
}