import { Navigate, Route, Routes } from "react-router-dom";
import { ActivityFeedPage } from "./ActivityFeedPage";
import { DashboardSummaryPage } from "./DashboardSummaryPage";
import { MemberDebtDetailPage } from "./MemberDebtDetailPage";
import "./dashboard.css";

/**
 * Nested routes under `/houses/:houseId/dashboard/*`.
 * Orchestrator: mount inside `HouseLayout` in `HousesRoutes.tsx`.
 */
export function DashboardRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardSummaryPage />} />
      <Route path="activity" element={<ActivityFeedPage />} />
      <Route path="members/:memberId" element={<MemberDebtDetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
