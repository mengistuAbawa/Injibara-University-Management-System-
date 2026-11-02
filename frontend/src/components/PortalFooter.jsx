import './PortalFooter.css';

export default function PortalFooter() {
  return (
    <footer className="portal-footer">
      <span>Injibara University Management System</span>
      <span>© {new Date().getFullYear()} Injibara University</span>
    </footer>
  );
}
