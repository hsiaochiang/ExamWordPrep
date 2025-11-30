import { Outlet } from 'react-router-dom';
import AppRouter from './router';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './store/AuthContext';

function Shell() {
  const { currentUser } = useAuth();
  return (
    <div className="app-shell">
      {currentUser && <Navbar />}
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return <AppRouter shell={<Shell />} />;
}

export default App;
