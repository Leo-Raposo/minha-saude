import React, { useState } from 'react';
import { BioimpedanceView } from './components/body/BioimpedanceView';
import { DashboardView } from './components/dashboard/DashboardView';
import { BloodTestsView } from './components/labs/BloodTestsView';
import { BottomNav, MobileHeader } from './components/layout/MobileNav';
import { Sidebar } from './components/layout/Sidebar';
import { Toast } from './components/layout/Toast';
import { MeasurementDrawer } from './components/modals/MeasurementDrawer';
import { PdfUploadModal } from './components/modals/PdfUploadModal';
import { HealthProvider, useHealth } from './context/HealthContext';

const AppShell: React.FC = () => {
  const { screen } = useHealth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-canvas text-ink font-sans">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

      <main className="flex-1 min-w-0 px-[clamp(18px,4vw,48px)] pt-[clamp(20px,4vw,48px)] pb-32">
        <div className="max-w-[1120px] mx-auto flex flex-col gap-7">
          <MobileHeader />
          {screen === 'overview' && <DashboardView />}
          {screen === 'labs' && <BloodTestsView />}
          {screen === 'body' && <BioimpedanceView />}
        </div>
      </main>

      <BottomNav />
      <MeasurementDrawer />
      <PdfUploadModal />
      <Toast />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HealthProvider>
      <AppShell />
    </HealthProvider>
  );
};

export default App;
