import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RequestList from './pages/RequestList';
import NewRequest from './pages/NewRequest';
import RequestDetails from './pages/RequestDetails';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import SystemModeling from './pages/SystemModeling';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="solicitacoes" element={<RequestList />} />
          <Route path="nova-solicitacao" element={<NewRequest />} />
          <Route path="solicitacoes/:id" element={<RequestDetails />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="modelagem" element={<SystemModeling />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
