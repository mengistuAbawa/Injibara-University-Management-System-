import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  getMySections,
  getSectionStudents,
  saveBulkGrades,
} from '../../services/instructorService';
import './EnterGrades.css';

export default function EnterGrades() {
  const [params] = useSearchParams();

  /* ---------- state ---------- */
  const [sections, setSections]               = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [sectionId, setSectionId]             = useState(params.get('section') || '');

  const [students, setStudents]               = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [marks, setMarks]                     = useState({});
  const [saving, setSaving]                   = useState(false);
  const [message, setMessage]                 = useState('');
  const [error, setError]                     = useState('');

  /* ---------- load sections ---------- */
  useEffect(() => {
    setLoadingSections(true);
    getMySections()
      .then((data) => {
        setSections(Array.isArray(data) ? data : []);
        /* auto-select if only one section */
        if (!sectionId && data.length === 1) {
          setSectionId(String(data[0].section_id));
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load sections');
      })
      .finally(() => setLoadingSections(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- load students for selected section ---------- */
  useEffect(() => {
    if (!sectionId) return;

    setLoadingStudents(true);
    setStudents([]);
    setMarks({});
    setMessage('');
    setError('');

    getSectionStudents(sectionId)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);

        const initial = {};
        list.forEach((s) => {
          initial[s.enrollment_id] = {
            assignment: s.assignment_mark ?? 0,
            midterm:    s.midterm_mark    ?? 0,
            final:      s.final_mark      ?? 0,
          };
        });
        setMarks(initial);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load students');
      })
      .finally(() => setLoadingStudents(false));
  }, [sectionId]);

  /* ---------- update one mark ---------- */
  const update = (eid, field, value) => {
    const max = field === 'assignment' ? 30 : field === 'midterm' ? 20 : 50;
    let n = Number(value);
    if (isNaN(n) || n < 0) n = 0;
    if (n > max) n = max;

    setMarks((prev) => ({
      ...prev,
      [eid]: { ...prev[eid], [field]: n },
    }));
  };

  /* ---------- totals + letter preview ---------- */
  const totalFor = (eid) => {
    const m = marks[eid];
    if (!m) return 0;
    return (m.assignment || 0) + (m.midterm || 0) + (m.final || 0);
  };

  const letterFor = (total) => {
     if (total >= 90) return 'A+';
    if (total >= 85) return 'A';
    if (total >= 80) return 'A-';
    if (total >= 75) return 'B+';
    if (total >= 70) return 'B';
    
    if (total >= 65) return 'B-';
    if (total >= 60) return 'C+';
    if (total >= 55) return 'C';
     if (total >= 50) return 'C-';
     if (total >= 45) return 'D+';
     if (total >= 40) return 'D';


    return 'F';
  };

  /* ---------- save ---------- */
  const save = async () => {
    if (!sectionId) {
      setError('Please select a section first');
      return;
    }
    if (students.length === 0) {
      setError('No students to grade');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const grades = students.map((s) => ({
        enrollment_id: s.enrollment_id,
        assignment:    marks[s.enrollment_id]?.assignment || 0,
        midterm:       marks[s.enrollment_id]?.midterm    || 0,
        final:         marks[s.enrollment_id]?.final      || 0,
      }));

      const res = await saveBulkGrades(sectionId, grades);
      setMessage(`✅ ${res.message} — ${res.count} student(s) updated`);

      /* re-fetch so server-computed letter and point reflect */
      const fresh = await getSectionStudents(sectionId);
      setStudents(Array.isArray(fresh) ? fresh : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- clear all marks ---------- */
  const clearAll = () => {
    const fresh = {};
    students.forEach((s) => {
      fresh[s.enrollment_id] = { assignment: 0, midterm: 0, final: 0 };
    });
    setMarks(fresh);
  };

  /* ---------- render ---------- */
  return (
    <>
      <main className="eg-main">
          <div className="title-strip">Enter Grades</div>

          {/* ---- Loading sections ---- */}
          {loadingSections && (
            <div className="hint-box">Loading your sections…</div>
          )}

          {/* ---- No sections assigned ---- */}
          {!loadingSections && sections.length === 0 && (
            <div className="warn-box">
              <strong>No sections assigned to you yet.</strong>
              <p>
                You are not currently teaching any section for this semester.
                Please contact the <strong>Registrar</strong> or your{' '}
                <strong>Department Head (HOD)</strong> to be assigned to a
                section.
              </p>
            </div>
          )}

          {/* ---- Section dropdown ---- */}
          {!loadingSections && sections.length > 0 && (
            <div className="filter-row">
              <label htmlFor="section">Section</label>
              <select
                id="section"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                <option value="">-- Select Section --</option>
                {sections.map((s) => (
                  <option key={s.section_id} value={s.section_id}>
                    {s.course_code} — {s.course_title} ({s.semester} {s.academic_year})
                    {s.enrolled != null ? ` — ${s.enrolled}/${s.capacity} enrolled` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ---- Banners ---- */}
          {message && <div className="ok-bar">{message}</div>}
          {error   && <div className="err-bar">❌ {error}</div>}

          {/* ---- Loading students ---- */}
          {loadingStudents && (
            <div className="hint-box">Loading students…</div>
          )}

          {/* ---- Empty section ---- */}
          {!loadingStudents && sectionId && students.length === 0 && !error && (
            <div className="warn-box">
              <strong>No students enrolled in this section.</strong>
              <p>
                The Registrar has not enrolled any students into this section yet.
                You can still take attendance or wait until enrollment is complete.
              </p>
              <Link to="/instructor/sections" className="link-btn">
                ← Back to My Sections
              </Link>
            </div>
          )}

          {/* ---- Grade entry table ---- */}
          {!loadingStudents && students.length > 0 && (
            <>
              <table className="data-table grade-entry">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student No.</th>
                    <th>Student Name</th>
                    <th>Assignment (30)</th>
                    <th>Midexam (20)</th>
                    <th>Final (50)</th>
                    <th>Total (100)</th>
                    <th>Letter</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const total = totalFor(s.enrollment_id);
                    return (
                      <tr key={s.enrollment_id}>
                        <td>{i + 1}</td>
                        <td>{s.student_number}</td>
                        <td>{s.first_name} {s.last_name}</td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={marks[s.enrollment_id]?.assignment ?? 0}
                            onChange={(e) =>
                              update(s.enrollment_id, 'assignment', e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={marks[s.enrollment_id]?.midterm ?? 0}
                            onChange={(e) =>
                              update(s.enrollment_id, 'midterm', e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={marks[s.enrollment_id]?.final ?? 0}
                            onChange={(e) =>
                              update(s.enrollment_id, 'final', e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            value={total}
                            aria-label={`Total for ${s.first_name} ${s.last_name}`}
                            readOnly
                          />
                        </td>
                        <td><strong>{letterFor(total)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="actions">
                <button className="save-btn" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save All Grades'}
                </button>
                <button className="clear-btn" onClick={clearAll} disabled={saving}>
                  Clear All
                </button>
              </div>
            </>
          )}
      </main>

      <div className="copyright-bar">Copyright 2026</div>
    </>
  );
}
