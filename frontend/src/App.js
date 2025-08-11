import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/toast.css';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Settings from './pages/Settings';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <Layout>
              <POS />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position={isMobile ? "bottom-center" : "bottom-right"}
          reverseOrder={true}
          gutter={6}
          containerStyle={{
            bottom: isMobile ? 20 : 30,
            right: isMobile ? 'auto' : 20,
            left: isMobile ? '50%' : 'auto',
            transform: isMobile ? 'translateX(-50%)' : 'none',
            zIndex: 9999,
          }}
          toastOptions={{
            duration: 3000,
            onClick: (event, toast) => {
              toast.dismiss();
            },
            style: {
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              minWidth: isMobile ? '280px' : '320px',
              maxWidth: isMobile ? '90vw' : '450px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease-out',
              position: 'relative',
              cursor: 'pointer',
              userSelect: 'none',
            },
            success: {
              duration: 3000,
              onClick: (event, toast) => toast.dismiss(),
              style: {
                background: 'rgba(240, 253, 244, 0.9)',
                backdropFilter: 'blur(12px)',
                color: '#065f46',
                border: '1px solid rgba(187, 247, 208, 0.7)',
                boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.15), 0 10px 10px -5px rgba(16, 185, 129, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '500',
              },
              iconTheme: {
                primary: '#10b981',
                secondary: 'rgba(240, 253, 244, 0.9)',
              },
            },
            error: {
              duration: 4000,
              onClick: (event, toast) => toast.dismiss(),
              style: {
                background: 'rgba(254, 242, 242, 0.9)',
                backdropFilter: 'blur(12px)',
                color: '#7f1d1d',
                border: '1px solid rgba(254, 202, 202, 0.7)',
                boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.15), 0 10px 10px -5px rgba(239, 68, 68, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '500',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: 'rgba(254, 242, 242, 0.9)',
              },
            },
            loading: {
              duration: Infinity,
              onClick: (event, toast) => toast.dismiss(),
              style: {
                background: 'rgba(239, 246, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                color: '#1e3a8a',
                border: '1px solid rgba(219, 234, 254, 0.7)',
                boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '500',
              },
              iconTheme: {
                primary: '#3b82f6',
                secondary: 'rgba(239, 246, 255, 0.9)',
              },
            },
            custom: {
              onClick: (event, toast) => toast.dismiss(),
              style: {
                background: 'rgba(255, 251, 235, 0.9)',
                backdropFilter: 'blur(12px)',
                color: '#78350f',
                border: '1px solid rgba(254, 215, 170, 0.7)',
                boxShadow: '0 20px 25px -5px rgba(245, 158, 11, 0.15), 0 10px 10px -5px rgba(245, 158, 11, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '500',
              },
              iconTheme: {
                primary: '#f59e0b',
                secondary: 'rgba(255, 251, 235, 0.9)',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
};

export default App;
