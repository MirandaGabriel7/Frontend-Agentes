import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme';
import { MainLayout } from './layout/MainLayout';
import { AgentsPage } from './pages/AgentsPage';
import { TrpAgentPage } from './pages/TrpAgentPage';
import { DfdAgentPage } from './pages/DfdAgentPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/agents" replace />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/trp" element={<TrpAgentPage />} />
            <Route path="/agents/dfd" element={<DfdAgentPage />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

