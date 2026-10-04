import { HashRouter, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicLayout } from './components/PublicLayout';
import { Toaster } from './components/Toast';
import { useStore } from './lib/store';
import Home from './pages/Home';
import LiveIssues from './pages/LiveIssues';
import IssueDetail from './pages/IssueDetail';
import WardRankings from './pages/WardRankings';
import HowItWorks from './pages/HowItWorks';
import CitizenPortal from './pages/citizen/CitizenPortal';
import ReportFlow from './pages/citizen/ReportFlow';
import MunicipalApp from './pages/municipal/MunicipalApp';
import VerifierApp from './pages/verifier/VerifierApp';
import NotFound from './pages/NotFound';

export default function App() {
  const lang = useStore((s) => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="live" element={<LiveIssues />} />
          <Route path="issues/:id" element={<IssueDetail />} />
          <Route path="rankings" element={<WardRankings />} />
          <Route path="how" element={<HowItWorks />} />
          <Route path="citizen" element={<CitizenPortal />} />
          <Route path="citizen/complaints" element={<CitizenPortal view="complaints" />} />
          <Route path="citizen/notifications" element={<CitizenPortal view="notifications" />} />
          <Route path="report" element={<ReportFlow />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="municipal/*" element={<MunicipalApp />} />
        <Route path="verifier/*" element={<VerifierApp />} />
      </Routes>
      <Toaster />
    </HashRouter>
  );
}
