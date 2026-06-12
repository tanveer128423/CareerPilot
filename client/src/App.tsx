import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { LandingPage } from "./pages/LandingPage";
import { UploadPage } from "./pages/UploadPage";
import { DashboardPage } from "./pages/DashboardPage";

function NavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <Compass size={16} />
          </span>
          CareerPilot
        </Link>
        {pathname !== "/upload" && pathname !== "/dashboard" && (
          <Link to="/upload" className="text-sm font-medium text-brand-600 hover:text-brand-500">
            Get started →
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
