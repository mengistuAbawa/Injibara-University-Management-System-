import { useEffect, useState } from 'react';
import {
  searchStudents,
  listSections,
  enrollStudent,
  getStudentEnrollments,
  dropEnrollment,
} from '../../services/registrarService';
import './EnrollStudent.css';

export default function EnrollStudent() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [message, setMessage] = useState('');
  const [studentListOpen, setStudentListOpen] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);

  /* initial load */
  useEffect(() => {
    listSections().then(setSections).catch(() => undefined);
    searchStudents('')
      .then((data) => setStudents(data))
      .catch(() => undefined)
      .finally(() => setLoadingStudents(false));
  }, []);

  /* search students */
  const handleSearch = async () => {
    setLoadingStudents(true);
    try {
      const data = await searchStudents(query);
      setStudents(data);
    } finally {
      setLoadingStudents(false);
    }
  };

  /* select student → load their enrollments */
  const handleSelect = async (student) => {
    setSelectedStudent(student);
    setStudentListOpen(false);
    const data = await getStudentEnrollments(student.student_id);
    setEnrollments(data);
    setMessage('');
  };

  /* enroll */
  const handleEnroll = async () => {
    if (!selectedStudent || !sectionId) return;
    try {
      await enrollStudent({
        student_id: selectedStudent.student_id,
        section_id: sectionId,
        academic_year: academicYear,
      });
      setMessage('✅ Enrolled successfully');
      const data = await getStudentEnrollments(selectedStudent.student_id);
      setEnrollments(data);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  /* drop */
  const handleDrop = async (enrollmentId) => {
    if (!window.confirm('Drop this enrollment?')) return;
    await dropEnrollment(enrollmentId);
    const data = await getStudentEnrollments(selectedStudent.student_id);
    setEnrollments(data);
  };

  return (
    <div className="enroll-page">
      <div className="title-strip">Enroll Student</div>
      <button type="button" className="search-btn" onClick={() => setStudentListOpen(true)}>
        Select Student
      </button>

      {studentListOpen && (
        <div className="student-list-backdrop" role="presentation">
          <div className="student-list-modal" role="dialog" aria-modal="true" aria-labelledby="student-list-title">
            <div className="student-list-header">
              <h3 id="student-list-title">Registered Students</h3>
              {students.length > 0 && (
                <span>{students.length} student{students.length === 1 ? '' : 's'}</span>
              )}
            </div>

            <div className="search-row student-list-search">
              <input
                placeholder="Search by student number / name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" type="button" onClick={handleSearch}>Search</button>
            </div>

            {loadingStudents ? (
              <div className="student-list-message">Loading registered students...</div>
            ) : students.length === 0 ? (
              <div className="student-list-message">No registered students found.</div>
            ) : (
              <div className="student-list-table-wrap">
                <table className="data-table student-list-table">
                  <thead>
                    <tr>
                      <th>Student No.</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id}>
                        <td>{student.student_number}</td>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.department_name || '-'}</td>
                        <td>{student.current_year}</td>
                        <td>{student.status}</td>
                        <td>
                          <button type="button" onClick={() => handleSelect(student)}>Select</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="student-list-actions">
              <button type="button" className="student-list-close" onClick={() => setStudentListOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* search bar */}
      <div className="search-row">
        <input
          placeholder="Search by student number / name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="search-btn" onClick={handleSearch}>Search</button>
      </div>

      {/* results */}
      {students.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Student No.</th>
              <th>Name</th>
              <th>Year</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.student_id}
                className={selectedStudent?.student_id === s.student_id ? 'selected' : ''}
              >
                <td>{s.student_number}</td>
                <td>{s.first_name} {s.last_name}</td>
                <td>{s.current_year}</td>
                <td>{s.status}</td>
                <td>
                  <button onClick={() => handleSelect(s)}>Select</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* selected student panel */}
      {selectedStudent && (
        <>
          <h3 className="section-title">
            Enrolling: {selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.student_number})
          </h3>

          <div className="enroll-form">
            <label>Section
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">-- Select Section --</option>
                {sections.map((s) => (
                  <option key={s.section_id} value={s.section_id}>
                    {s.course_code} — {s.course_title} ({s.semester} {s.academic_year}) [{s.enrolled}/{s.capacity}]
                  </option>
                ))}
              </select>
            </label>

            <label>Academic Year
              <input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </label>

            <button className="enroll-btn" onClick={handleEnroll} disabled={!sectionId}>
              Enroll
            </button>
          </div>

          {message && <div className="msg">{message}</div>}

          {/* current enrollments */}
          <h4 className="section-title">Current Enrollments</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course</th>
                <th>Credit</th>
                <th>Semester</th>
                <th>Year</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.enrollment_id}>
                  <td>{e.course_code}</td>
                  <td>{e.course_title}</td>
                  <td>{e.credit_hours}</td>
                  <td>{e.semester}</td>
                  <td>{e.academic_year}</td>
                  <td>{e.status}</td>
                  <td>
                    {e.status === 'Enrolled' && (
                      <button className="drop-btn" onClick={() => handleDrop(e.enrollment_id)}>
                        Drop
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}