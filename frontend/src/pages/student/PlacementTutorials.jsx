import { useEffect, useState } from 'react';
import { getTutorials } from '../../services/studentService';
import './PlacementTutorials.css';

export default function PlacementTutorials() {
  const [items, setItems] = useState([]);
  useEffect(() => { getTutorials().then(setItems).catch(console.error); }, []);
  return (
    <main className="placement-tutorials-page">
      <header className="placement-tutorials-header">
        <span className="placement-tutorials-eyebrow">STUDENT RESOURCES</span>
        <h1>Placement Tutorials</h1>
        <p>Explore these guides to help you prepare for department placement.</p>
      </header>
      {items.length ? (
        <ul className="placement-tutorials-list">
          {items.map((t, i) => (
            <li className="placement-tutorial-card" key={t.id || `${t.title}-${i}`}>
              <span className="placement-tutorial-icon" aria-hidden="true">▶</span>
              <a href={t.url} target="_blank" rel="noreferrer">
                <span className="placement-tutorial-title">{t.title}</span>
                <span className="placement-tutorial-action">Open tutorial <span aria-hidden="true">↗</span></span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="placement-tutorials-empty">No tutorials are available yet.</div>
      )}
    </main>
  );
}
