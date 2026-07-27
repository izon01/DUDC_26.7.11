import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Intro from "./pages/Intro";
import MissionChecklist from "./pages/MissionChecklist";
import Community from "./pages/Community";

// WorkManual/CultureManual pull in CKEditor 5 (~1.2MB), which otherwise
// ships in every route's bundle. Lazy-load just these two so that cost is
// only paid by visitors who actually open a manual or culture-post editor.
const WorkManual = lazy(() => import("./pages/WorkManual"));
const CultureManual = lazy(() => import("./pages/CultureManual"));
const Admin = lazy(() => import("./pages/Admin"));

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/intro" replace />;
  return children;
}

function PageLoading() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/intro" : "/login"} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/intro" replace /> : <LandingPage />} />
      <Route
        path="/intro"
        element={
          <RequireAuth>
            <Intro />
          </RequireAuth>
        }
      />
      <Route
        path="/work-manual"
        element={
          <RequireAuth>
            <Suspense fallback={<PageLoading />}>
              <WorkManual />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/culture-manual"
        element={
          <RequireAuth>
            <Suspense fallback={<PageLoading />}>
              <CultureManual />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/mission-checklist"
        element={
          <RequireAuth>
            <MissionChecklist />
          </RequireAuth>
        }
      />
      <Route
        path="/community"
        element={
          <RequireAuth>
            <Community />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Suspense fallback={<PageLoading />}>
              <Admin />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
