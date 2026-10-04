import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpenCheck, MessageSquareText, Star, UsersRound } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api.js';

const number = new Intl.NumberFormat('en-US');

export default function Dashboard({ user, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then((response) => setDashboard(response.data)).catch((requestError) => setError(requestError.message));
  }, []);

  const totals = dashboard?.totals || {};
  const metrics = [
    { label: 'Student voices', value: number.format(totals.students || 0), meta: 'Active student records', icon: UsersRound, tone: 'mint' },
    { label: 'Feedback received', value: number.format(totals.responses || 0), meta: 'Across all forms', icon: MessageSquareText, tone: 'coral' },
    { label: 'Open forms', value: number.format(totals.forms || 0), meta: 'Currently accepting responses', icon: BookOpenCheck, tone: 'blue' },
    { label: 'Average rating', value: Number(totals.averageRating || 0).toFixed(1), meta: 'Out of 5.0 · all subjects', icon: Star, tone: 'gold' },
  ];

  return (
    <section className="dashboard-page">
      <div className="welcome-band"><div><p className="eyebrow">Thursday, October 1, 2026 · Academic year 2026</p><h1>Good morning, {user.full_name.split(' ')[0]}.</h1><p>Here’s how your learning community is feeling this week.</p></div><button className="button button-light" onClick={() => onNavigate('feedback-forms')}>View active forms <ArrowUpRight size={16} /></button><div className="welcome-mark" aria-hidden="true"><span>F</span></div></div>
      {error && <div className="inline-error">{error}. Check that the API and MySQL database are running.</div>}
      <div className="metric-grid">{metrics.map(({ label, value, meta, icon: Icon, tone }) => <article className="metric" key={label}><div className={`metric-icon tone-${tone}`}><Icon size={19} strokeWidth={1.8} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{meta}</small></div><div className="metric-rule" /></article>)}</div>
      <div className="dashboard-content"><article className="panel trend-panel"><div className="panel-heading"><div><p className="eyebrow">Response activity</p><h2>Listening, week by week</h2></div><span className="chart-legend"><i /> Responses · last 7 days</span></div><div className="chart-area">{dashboard?.responseTrend?.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboard.responseTrend} margin={{ top: 14, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="responseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18765e" stopOpacity={0.22} /><stop offset="100%" stopColor="#18765e" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e6ebe5" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#88928b', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#88928b', fontSize: 11 }} allowDecimals={false} /><Tooltip contentStyle={{ border: '1px solid #e2e7e0', borderRadius: 7, boxShadow: '0 8px 24px #10251a12' }} /><Area type="monotone" dataKey="responses" stroke="#18765e" strokeWidth={2.5} fill="url(#responseFill)" activeDot={{ r: 5, strokeWidth: 0, fill: '#18765e' }} /></AreaChart></ResponsiveContainer> : <div className="empty-chart">{dashboard ? 'No responses recorded in the last seven days.' : 'Loading response activity...'}</div>}</div></article>
        <article className="panel teacher-panel"><div className="panel-heading"><div><p className="eyebrow">Teacher pulse</p><h2>Highest rated</h2></div><button className="text-button" onClick={() => onNavigate('reports')}>Full report <ArrowUpRight size={14} /></button></div><div className="teacher-list">{(dashboard?.teachersByRating || []).map((teacher, index) => <div className="teacher-row" key={teacher.teacher}><span className={`teacher-rank rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className="teacher-avatar">{teacher.teacher.split(' ').slice(-1)[0][0]}</span><span className="teacher-name">{teacher.teacher}<small>{teacher.responses} responses</small></span><strong className="teacher-score"><Star size={13} fill="currentColor" /> {Number(teacher.rating).toFixed(1)}</strong></div>)}{dashboard && dashboard.teachersByRating?.length === 0 && <div className="empty-chart">Teacher ratings will appear as feedback arrives.</div>}{!dashboard && <div className="empty-chart">Loading teacher ratings...</div>}</div><div className="teacher-footnote">Average instructor rating · out of 5</div></article></div>
      <div className="dashboard-note"><span className="note-dot" /><span>Responses are anonymous to teaching staff. Administrators can review aggregate results in reports.</span><button className="text-button" onClick={() => onNavigate('reports')}>Explore reports <ArrowUpRight size={14} /></button></div>
    </section>
  );
}