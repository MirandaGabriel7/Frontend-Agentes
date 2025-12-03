import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from './theme';
import { MainLayout } from './layout/MainLayout';
import { AgentsPage } from './pages/AgentsPage';
import { DfdAgentPage } from './pages/DfdAgentPage';
import { TrpListPage } from './modules/trp/pages/TrpListPage';
import { TrpNewPage } from './modules/trp/pages/TrpNewPage';
import { TrpDetailPage } from './modules/trp/pages/TrpDetailPage';
import { TrpPage } from './modules/trp/pages/TrpPage';
import { TrpResultPage } from './modules/trp/pages/TrpResultPage';
import AgenteDfdResultado from './pages/AgenteDfdResultado';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/agents" replace />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/trp" element={<TrpPage />} />
              <Route path="/agents/trp/lista" element={<TrpListPage />} />
              <Route path="/agents/trp/novo" element={<TrpNewPage />} />
              <Route path="/agents/trp/:id" element={<TrpDetailPage />} />
              <Route path="/agents/trp/resultado/:id" element={<TrpResultPage />} />
              <Route path="/agents/dfd" element={<DfdAgentPage />} />
              <Route path="/agents/dfd/resultado/:id" element={<AgenteDfdResultado />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;

