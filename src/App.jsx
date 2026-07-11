import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Intro from "./pages/Intro";
import WorkManual from "./pages/WorkManual";
import CultureManual from "./pages/CultureManual";
import MissionChecklist from "./pages/MissionChecklist";
import Community from "./pages/Community";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/intro" element={<Intro />} />
      <Route path="/work-manual" element={<WorkManual />} />
      <Route path="/culture-manual" element={<CultureManual />} />
      <Route path="/mission-checklist" element={<MissionChecklist />} />
      <Route path="/community" element={<Community />} />
    </Routes>
  );
}
