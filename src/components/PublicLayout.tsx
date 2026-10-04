import { Outlet, Link, useLocation } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useT } from '../i18n';
import { useEffect } from 'react';

export function PublicLayout() {
  const loc = useLocation();
  const t = useT();
  useEffect(() => window.scrollTo(0, 0), [loc.pathname]);
  const showFab = !loc.pathname.startsWith('/report');
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main key={loc.pathname} className="flex-1 page-enter">
        <Outlet />
      </main>
      <Footer />
      {showFab && (
        <Link
          to="/report"
          className="fixed bottom-5 right-4 z-[900] flex items-center gap-2 rounded-full bg-brand-700 px-4 py-3.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-800 md:hidden"
        >
          <Camera className="h-5 w-5" /> {t('common.report')}
        </Link>
      )}
    </div>
  );
}
