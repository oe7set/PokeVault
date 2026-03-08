import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { ToastContainer } from '@/components/ui/Toast';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-[#0d0d1a]">
      <Navbar />
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <CardDetailModal />
      <ToastContainer />
    </div>
  );
}
