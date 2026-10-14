import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default function GraduatedStudents() {
  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="content">
          <h2>Graduated Students</h2>
          <p>List of graduated students will appear here.</p>
        </main>
      </div>
    </>
  );
}