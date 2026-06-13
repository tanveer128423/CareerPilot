import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";
import { LandingPage } from "./pages/LandingPage";
import { UploadPage } from "./pages/UploadPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ComparePage } from "./pages/ComparePage";
import { PageTransition } from "./components/common/Motion";

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
        <div className="flex items-center gap-4">
          {pathname !== "/compare" && (
            <Link to="/compare" className="text-sm font-medium text-ink-soft hover:text-ink">
              Examples
            </Link>
          )}
          {pathname !== "/upload" && pathname !== "/dashboard" && (
            <Link to="/upload" className="text-sm font-medium text-brand-600 hover:text-brand-500">
              Get started →
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/upload" element={<PageTransition><UploadPage /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><ComparePage /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <NavBar />
      <main className="flex-1">
        <AnimatedRoutes />
      </main>
    </div>
  );
}
