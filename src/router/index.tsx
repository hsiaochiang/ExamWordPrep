import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import UserDashboard from '../pages/UserDashboard';
import WordListPage from '../pages/WordListPage';
import FlashcardPage from '../pages/FlashcardPage';
import QuizPage from '../pages/QuizPage';
import HistoryPage from '../pages/HistoryPage';
import SettingsPage from '../pages/SettingsPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminUserRecordsPage from '../pages/AdminUserRecordsPage';
import { useAuth } from '../store/AuthContext';

type Props = {
  shell: JSX.Element;
};

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!currentUser.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRouter({ shell }: Props) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute>{shell}</ProtectedRoute>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/words" element={<WordListPage />} />
        <Route path="/flashcards" element={<FlashcardPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route
        element={
          <AdminRoute>
            {shell}
          </AdminRoute>
        }
      >
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/records" element={<AdminUserRecordsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
