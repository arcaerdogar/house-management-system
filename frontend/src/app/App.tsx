import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import { HouseProvider } from "@/app/HouseContext";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { AppLayout } from "@/app/AppLayout";
import { HousesRoutes } from "@/features/houses";
import { LoginPage } from "@/auth/LoginPage";
import { RegisterPage } from "@/auth/RegisterPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HouseProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/houses" replace />} />
              <Route path="houses/*" element={<HousesRoutes />} />
            </Route>
            <Route path="*" element={<Navigate to="/houses" replace />} />
          </Routes>
        </HouseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
