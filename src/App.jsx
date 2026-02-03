
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import Files from './pages/Files';
import Meetings from './pages/Meetings';
import Prospecting from './pages/Prospecting';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user has no role, force to onboarding
  // BUT don't loop if we are already trying to go to Onboarding
  if (!user.role && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  // If user HAS role and tries to go to onboarding, send to dashboard
  if (user.role && window.location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/prospeccao" element={<PrivateRoute><Prospecting /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/tarefas" element={<PrivateRoute><Tasks /></PrivateRoute>} />
          <Route path="/tasks" element={<Navigate to="/tarefas" replace />} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/relatorios" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/arquivos" element={<PrivateRoute><Files /></PrivateRoute>} />
          <Route path="/reunioes" element={<PrivateRoute><Meetings /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
