import { useEffect, useState } from 'react';
import { ArrowDownWideNarrow, ChevronLeft, ChevronRight, LoaderCircle, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api, queryString } from '../services/api.js';

const sharedStatus = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
const definitions = {
  students: { title: 'Students', subtitle: 'Manage student records and course enrollment.', fields: [
    { name: 'student_code', label: 'Student ID', required: true }, { name: 'full_name', label: 'Full name', required: true }, { name: 'email', label: 'Email address', type: 'email', required: true }, { name: 'course_id', label: 'Course', lookup: 'courses' }, { name: 'enrollment_year', label: 'Enrollment year', type: 'number' }, { name: 'status', label: 'Status', type: 'select', options: [...sharedStatus, { value: 'graduated', label: 'Graduated' }] },
  ] },
  teachers: { title: 'Teachers', subtitle: 'Keep faculty profiles and departments current.', fields: [
    { name: 'employee_code', label: 'Employee ID', required: true }, { name: 'full_name', label: 'Full name', required: true }, { name: 'email', label: 'Email address', type: 'email', required: true }, { name: 'department', label: 'Department' }, { name: 'status', label: 'Status', type: 'select', options: sharedStatus },
  ] },
  courses: { title: 'Courses', subtitle: 'Organize academic programs and departments.', fields: [
    { name: 'course_code', label: 'Course code', required: true }, { name: 'name', label: 'Course name', required: true }, { name: 'department', label: 'Department' }, { name: 'status', label: 'Status', type: 'select', options: sharedStatus },
  ] },
  subjects: { title: 'Subjects', subtitle: 'Manage the subjects offered across courses.', fields: [
    { name: 'course_id', label: 'Course', lookup: 'courses', required: true }, { name: 'subject_code', label: 'Subject code', required: true }, { name: 'name', label: 'Subject name', required: true }, { name: 'term', label: 'Term' }, { name: 'status', label: 'Status', type: 'select', options: sharedStatus },
  ] },
  'feedback-questions': { title: 'Questions', subtitle: 'Build a reusable library of feedback questions.', fields: [
    { name: 'prompt', label: 'Question prompt', type: 'textarea', required: true }, { name: 'question_type', label: 'Response type', type: 'select', options: [{ value: 'rating', label: 'Rating · 1 to 5' }, { value: 'multiple_choice', label: 'Multiple choice' }, { value: 'text', label: 'Written response' }], required: true }, { name: 'options', label: 'Choices · JSON array', type: 'textarea', placeholder: '["Option one", "Option two"]' }, { name: 'is_required', label: 'Required question', type: 'checkbox' }, { name: 'status', label: 'Status', type: 'select', options: sharedStatus },
  ] },
  'feedback-forms': { title: 'Feedback forms', subtitle: 'Schedule feedback for a teacher, subject, and course.', fields: [
    { name: 'title', label: 'Form title', required: true }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'course_id', label: 'Course', lookup: 'courses', required: true }, { name: 'subject_id', label: 'Subject', lookup: 'subjects', required: true }, { name: 'teacher_id', label: 'Teacher', lookup: 'teachers', required: true }, { name: 'opens_at', label: 'Opens', type: 'datetime-local' }, { name: 'closes_at', label: 'Closes', type: 'datetime-local' }, { name: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }] }, { name: 'question_ids', label: 'Questions on this form', lookup: 'feedback-questions', type: 'multiselect' },
  ] },
  users: { title: 'Users', subtitle: 'Manage portal access and account status.', fields: [
    { name: 'full_name', label: 'Full name', required: true }, { name: 'email', label: 'Email address', type: 'email', required: true }, { name: 'role_id', label: 'Role', lookup: 'roles', required: true }, { name: 'password', label: 'Temporary password', type: 'password', required: true, createOnly: true }, { name: 'status', label: 'Status', type: 'select', options: sharedStatus },
  ] },
  roles: { title: 'Roles', subtitle: 'Configure role names used for access control.', fields: [
    { name: 'name', label: 'Role name', required: true }, { name: 'description', label: 'Description', type: 'textarea' },
  ] },
  'feedback-responses': { title: 'Responses', subtitle: 'Review submitted feedback records.', readOnly: true, fields: [] },
};

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function displayLabel(key) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ResourcePage({ resource, canWrite }) {
  const config = definitions[resource];
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortBy, setSortBy] = useState('id');
  const [filterValues, setFilterValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function load(page = pagination.page) {
    setLoading(true);
    setError('');
    try {
      const query = queryString({ page, limit: 10, search, sortBy, sortOrder, ...filterValues });
      const result = await api(`/${resource}?${query}`);
      setRows(result.data || []);
      setPagination(result.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }));
    const timer = setTimeout(() => load(1), 180);
    return () => clearTimeout(timer);
  }, [resource, search, sortBy, sortOrder, filterValues]);

  useEffect(() => {
    const resourcesNeeded = [...new Set(config.fields.filter((field) => field.lookup).map((field) => field.lookup))];
    if (resourcesNeeded.length === 0) return;
    Promise.all(resourcesNeeded.map(async (lookup) => {
      const response = await api(`/${lookup}?limit=100`);
      return [lookup, response.data || []];
    })).then((entries) => setLookups(Object.fromEntries(entries))).catch(() => setLookups({}));
  }, [resource]);

  function startCreate() {
    const initial = {};
    for (const field of config.fields) {
      if (field.type === 'checkbox') initial[field.name] = true;
      if (field.name === 'status') initial.status = resource === 'feedback-forms' ? 'draft' : 'active';
      if (field.type === 'multiselect') initial[field.name] = [];
    }
    setEditor({ id: null, values: initial });
  }

  async function startEdit(row) {
    const values = { ...row };
    for (const field of config.fields) {
      if (field.type === 'datetime-local' && values[field.name]) values[field.name] = String(values[field.name]).slice(0, 16).replace(' ', 'T');
      if (field.name === 'options' && values.options && typeof values.options !== 'string') values.options = JSON.stringify(values.options, null, 2);
    }
    if (resource === 'feedback-forms') {
      try {
        const response = await api(`/feedback-forms/${row.id}/questions`);
        values.question_ids = response.data.map((question) => String(question.id));
      } catch {
        values.question_ids = [];
      }
    }
    setEditor({ id: row.id, values });
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...editor.values };
    const questionIds = payload.question_ids;
    if (resource === 'feedback-forms') payload.question_ids = questionIds || [];
    for (const field of config.fields) if (field.type === 'checkbox') payload[field.name] = Boolean(payload[field.name]);
    for (const field of config.fields) if (field.type === 'datetime-local' && payload[field.name]) payload[field.name] = new Date(payload[field.name]).toISOString().slice(0, 19).replace('T', ' ');
    try {
      const response = await api(editor.id ? `/${resource}/${editor.id}` : `/${resource}`, {
        method: editor.id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setEditor(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/${resource}/${confirmDelete.id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
      setConfirmDelete(null);
    }
  }

  const columns = rows[0] ? Object.keys(rows[0]).filter((key) => !['updated_at'].includes(key)) : [];

  return (
    <section className="resource-page">
      <div className="page-heading">
        <div><p className="eyebrow">Workspace / {config.title}</p><h1>{config.title}</h1><p>{config.subtitle}</p></div>
        {canWrite && !config.readOnly && <button className="button button-primary" onClick={startCreate}><Plus size={17} /> New {config.title.replace(/s$/, '')}</button>}
      </div>
      <div className="table-toolbar">
        <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`} /></label>
        {config.fields.filter((field) => field.type === 'select').map((field) => <select className="filter-select" key={field.name} aria-label={`Filter by ${field.label}`} value={filterValues[field.name] || ''} onChange={(event) => setFilterValues((current) => ({ ...current, [field.name]: event.target.value }))}><option value="">All {field.label.toLowerCase()}</option>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>)}
        <button className="button button-quiet" onClick={() => setSortOrder((order) => order === 'asc' ? 'desc' : 'asc')}><ArrowDownWideNarrow size={16} /> {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}</button>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <div className="table-frame">
        {loading ? <div className="table-state"><LoaderCircle className="spin" size={22} /> Loading records</div> : rows.length === 0 ? <div className="table-state"><strong>No records found</strong><span>Try changing your search or add a record to get started.</span></div> : (
          <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column} onClick={() => setSortBy(column)}>{displayLabel(column)}{sortBy === column ? <span className="sort-indicator">{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span> : null}</th>)}{canWrite && !config.readOnly && <th className="actions-heading">Actions</th>}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column}>{column === 'status' ? <span className={`status-pill status-${String(row[column]).toLowerCase()}`}>{displayValue(row[column])}</span> : <span className={column === 'id' ? 'muted-cell' : ''}>{displayValue(row[column])}</span>}</td>)}{canWrite && !config.readOnly && <td className="row-actions"><button className="icon-button" aria-label={`Edit record ${row.id}`} onClick={() => startEdit(row)}><Pencil size={15} /></button><button className="icon-button danger-icon" aria-label={`Delete record ${row.id}`} onClick={() => setConfirmDelete(row)}><Trash2 size={15} /></button></td>}</tr>)}</tbody>
          </table></div>
        )}
      </div>
      <div className="table-footer"><span>{pagination.total} records</span><div className="pagination-controls"><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span><button className="icon-button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Next page" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => load(pagination.page + 1)}><ChevronRight size={17} /></button></div></div>
      {editor && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditor(null)}><section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="modal-heading"><div><p className="eyebrow">{editor.id ? 'Update record' : 'New record'}</p><h2 id="editor-title">{editor.id ? 'Edit' : 'Create'} {config.title.replace(/s$/, '')}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={() => setEditor(null)}><X size={18} /></button></div>
        <form onSubmit={save}><div className="form-grid">{config.fields.filter((field) => !(field.createOnly && editor.id)).map((field) => <label className={`field ${field.type === 'textarea' || field.type === 'multiselect' ? 'field-wide' : ''} ${field.type === 'checkbox' ? 'field-check' : ''}`} key={field.name}>{field.type === 'checkbox' ? <><input type="checkbox" checked={Boolean(editor.values[field.name])} onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, [field.name]: event.target.checked } }))} /><span>{field.label}</span></> : <><span>{field.label}{field.required ? ' *' : ''}</span>{field.type === 'textarea' ? <textarea rows="3" required={field.required} placeholder={field.placeholder || ''} value={editor.values[field.name] ?? ''} onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, [field.name]: event.target.value } }))} /> : field.type === 'multiselect' ? <select multiple size="4" value={editor.values[field.name] || []} onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, [field.name]: [...event.target.selectedOptions].map((option) => option.value) } }))}>{(lookups[field.lookup] || []).map((item) => <option key={item.id} value={item.id}>{item.prompt}</option>)}</select> : field.type === 'select' || field.lookup ? <select required={field.required} value={editor.values[field.name] ?? ''} onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, [field.name]: event.target.value } }))}><option value="">Select {field.label.toLowerCase()}</option>{(field.options || (lookups[field.lookup] || []).map((item) => ({ value: item.id, label: item.name || item.full_name || item.email || item.title }))).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type || 'text'} required={field.required} placeholder={field.placeholder || ''} value={editor.values[field.name] ?? ''} onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, [field.name]: event.target.value } }))} />}</>}</label>)}</div>
          {error && <div className="inline-error">{error}</div>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setEditor(null)}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save record'}</button></div></form>
      </section></div>}
      {confirmDelete && <div className="modal-backdrop"><section className="confirm-panel" role="dialog" aria-modal="true"><p className="eyebrow">Delete record</p><h2>Remove this record?</h2><p>This action cannot be undone. Related records may prevent deletion.</p><div className="modal-actions"><button className="button button-quiet" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="button button-danger" onClick={remove}>Delete record</button></div></section></div>}
    </section>
  );
}