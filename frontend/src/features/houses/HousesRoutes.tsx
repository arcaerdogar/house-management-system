import { Navigate, Route, Routes } from "react-router-dom";
import { AbsenceCalendarPage } from "./AbsenceCalendarPage";
import { HouseLayout, HouseOverviewPage } from "./HouseLayout";
import { HouseListPage } from "./HouseListPage";
import { HouseMembersPage } from "./HouseMembersPage";
import "./houses.css";

/**
 * Nested routes for `/houses/*`.
 * Orchestrator: replace `HousesPlaceholder` in App.tsx with `<HousesRoutes />`.
 */
export function HousesRoutes() {
  return (
    <Routes>
      <Route index element={<HouseListPage />} />
      <Route path=":houseId" element={<HouseLayout />}>
        <Route index element={<HouseOverviewPage />} />
        <Route path="members" element={<HouseMembersPage />} />
        <Route path="absences" element={<AbsenceCalendarPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/houses" replace />} />
    </Routes>
  );
}
