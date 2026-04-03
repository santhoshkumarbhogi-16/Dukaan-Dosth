import Header from './Header';
import BottomNav from './BottomNav';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="layout-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
