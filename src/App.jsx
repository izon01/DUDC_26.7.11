import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Intro from "./pages/Intro";
import WorkManual from "./pages/WorkManual";
import CultureManual from "./pages/CultureManual";
import MissionChecklist from "./pages/MissionChecklist";
import Community from "./pages/Community";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Home /> : <LandingPage />} />
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
            <WorkManual />
          </RequireAuth>
        }
      />
      <Route
        path="/culture-manual"
        element={
          <RequireAuth>
            <CultureManual />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
