import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Changelog } from './components/Changelog';
import { useEnrollmentData } from './hooks/useEnrollmentData';

function AppContent() {
  const { data, logs, loading, error, lastUpdated } = useEnrollmentData();

  return (
    <Layout>
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              data={data} 
              loading={loading} 
              error={error} 
              lastUpdated={lastUpdated} 
            />
          } 
        />
        <Route 
          path="/logs" 
          element={
            <Changelog logs={logs} />
          } 
        />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
