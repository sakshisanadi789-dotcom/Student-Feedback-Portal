import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, Clock3, LoaderCircle, MessageSquareText, Send, Star, X } from 'lucide-react';
import { api } from '../services/api.js';

function isOpen(form) {
  const now = Date.now();
  return (!form.opens_at || new Date(form.opens_at).getTime() <= now)
    && (!form.closes_at || new Date(form.closes_at).getTime() >= now);
}

export default function StudentFeedback({ user }) {
  const [forms, setForms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadForms() {
    setLoading(true);
    try {
      const response = await api('/feedback-forms?status=active&limit=100&sortBy=closes_at&sortOrder=asc');
      const activeForms = (response.data || []).filter(isOpen);
      const statuses = await Promise.all(activeForms.map(async (form) => {
        try {
          const status = await api(`/feedback-forms/${form.id}/my-response`);
          return { ...form, submitted: status.data.submitted };
        } catch {
          return { ...form, submitted: false };
        }
      }));
      setForms(statuses);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadForms(); }, []);

  async function openForm(form) {
    setSelected(form);
    setFormLoading(true);
    setError('');
    setAnswers({});
    try {
      const response = await api(`/feedback-forms/${form.id}/questions`);
      setQuestions(response.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = questions.map((question) => ({ question_id: question.id, ...answers[question.id] })).filter((answer) => Object.keys(answer).length > 1);
    try {
      await api('/feedback-responses', { method: 'POST', body: JSON.stringify({ form_id: selected.id, answers: payload }) });
      setForms((current) => current.map((form) => form.id === selected.id ? { ...form, submitted: true } : form));
      setSelected(null);
      setSuccess('Your feedback was submitted. Thank you for helping this course improve.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateAnswer(questionId, key, value) {
    setAnswers((current) => ({ ...current, [questionId]: { ...current[questionId], [key]: value } }));
  }

  return <section className="student-page"><div className="student-welcome"><div><p className="eyebrow">Your learning · Spring 2026</p><h1>Make your voice part of the course.</h1><p>Thoughtful feedback helps teaching evolve. Your responses are anonymous to your instructors.</p></div><span className="student-welcome-icon"><MessageSquareText size={30} /></span></div>
    {success && <div className="student-success"><Check size={16} />{success}<button onClick={() => setSuccess('')}>Dismiss</button></div>}
    {error && !selected && <div className="inline-error">{error}</div>}
    <div className="student-section-heading"><div><p className="eyebrow">Available now</p><h2>Course feedback</h2></div><span>{forms.filter((form) => !form.submitted).length} open</span></div>
    {loading ? <div className="student-state"><LoaderCircle className="spin" size={21} /> Loading your courses</div> : forms.length === 0 ? <div className="student-empty"><span><BookOpen size={22} /></span><strong>You’re all caught up.</strong><p>There are no open feedback forms right now. New forms will appear here.</p></div> : <div className="student-form-list">{forms.map((form) => <article className={`student-form-row ${form.submitted ? 'student-form-done' : ''}`} key={form.id}><span className="student-course-icon"><BookOpen size={18} /></span><div className="student-form-copy"><span className="student-form-course">{form.title}</span><strong>{form.description || 'Share a few thoughts about this course.'}</strong><small>{form.closes_at ? `Closes ${new Date(form.closes_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Open until further notice'} · {form.teacher_id ? 'Your instructor' : 'Course feedback'}</small></div>{form.submitted ? <span className="submitted-label"><Check size={14} /> Submitted</span> : <button className="button button-quiet" onClick={() => openForm(form)}>Share feedback <ArrowRight size={15} /></button>}</article>)}</div>}
    <div className="student-privacy-note"><span className="privacy-icon"><span>i</span></span><p><strong>Your privacy matters.</strong> Instructors see ratings and written feedback in reports. Student identities are never included in teaching reports.</p></div>
    {selected && <div className="modal-backdrop student-modal-backdrop"><section className="modal-panel student-modal" role="dialog" aria-modal="true" aria-labelledby="student-form-title"><div className="modal-heading"><div><p className="eyebrow">Course feedback · Anonymous</p><h2 id="student-form-title">{selected.title}</h2><p className="student-modal-description">{selected.description}</p></div><button className="icon-button" aria-label="Close feedback form" onClick={() => setSelected(null)}><X size={18} /></button></div>{formLoading ? <div className="student-state"><LoaderCircle className="spin" size={20} /> Loading questions</div> : <form onSubmit={submit}><div className="student-questions">{questions.map((question, index) => <fieldset className="student-question" key={question.id}><legend><span>{String(index + 1).padStart(2, '0')}</span>{question.prompt}{question.is_required ? <i>*</i> : null}</legend>{question.question_type === 'rating' ? <div className="rating-options" aria-label="Rate from 1 to 5">{[1, 2, 3, 4, 5].map((rating) => <label key={rating} className={Number(answers[question.id]?.rating_value) === rating ? 'rating-selected' : ''}><input type="radio" name={`rating-${question.id}`} value={rating} required={Boolean(question.is_required)} checked={Number(answers[question.id]?.rating_value) === rating} onChange={() => updateAnswer(question.id, 'rating_value', rating)} /><Star size={16} fill={Number(answers[question.id]?.rating_value) >= rating ? 'currentColor' : 'none'} /><span>{rating}</span></label>)}</div> : question.question_type === 'multiple_choice' ? <div className="choice-options">{(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((option) => <label key={option} className={answers[question.id]?.choice_value === option ? 'choice-selected' : ''}><input type="radio" name={`choice-${question.id}`} required={Boolean(question.is_required)} checked={answers[question.id]?.choice_value === option} onChange={() => updateAnswer(question.id, 'choice_value', option)} /><span>{option}</span></label>)}</div> : <textarea rows="3" required={Boolean(question.is_required)} maxLength={3000} placeholder="Share what is on your mind..." value={answers[question.id]?.text_value || ''} onChange={(event) => updateAnswer(question.id, 'text_value', event.target.value)} />}</fieldset>)}</div>{error && <div className="inline-error" role="alert">{error}</div>}<div className="student-submit-note"><Clock3 size={14} /> Usually takes less than 2 minutes</div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setSelected(null)}>Cancel</button><button type="submit" className="button button-primary" disabled={submitting || formLoading}>{submitting ? 'Sending...' : 'Submit feedback'}<Send size={14} /></button></div></form>}</section></div>}
  </section>;
}