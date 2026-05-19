import { Navigate, Route, Routes } from "react-router-dom";
import { ExpenseListPage } from "./ExpenseListPage";
import { InstantExpensePage } from "./InstantExpensePage";
import { RegularExpensePage } from "./RegularExpensePage";
import { RotationalExpensePage } from "./RotationalExpensePage";
import { RotationalTypesPage } from "./RotationalTypesPage";
import { TemplateAdminPage } from "./TemplateAdminPage";
import "./expenses.css";

/**
 * Nested routes under `/houses/:houseId/expenses/*`.
 * Orchestrator: mount inside `HouseLayout` in `HousesRoutes.tsx`.
 */
export function ExpensesRoutes() {
  return (
    <Routes>
      <Route index element={<ExpenseListPage />} />
      <Route path="instant/new" element={<InstantExpensePage />} />
      <Route path="regular/new" element={<RegularExpensePage />} />
      <Route path="templates" element={<TemplateAdminPage />} />
      <Route path="rotational" element={<RotationalTypesPage />} />
      <Route path="rotational/new" element={<RotationalExpensePage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
