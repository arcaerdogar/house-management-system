import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import { HouseProvider } from "@/app/HouseContext";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { AppLayout } from "@/app/AppLayout";
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
              <Route
                path="houses/*"
                element={
                  <p style={{ padding: "1rem" }}>
                    Ev yönetimi — frontend-houses agent tarafından doldurulacak.
                  </p>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HouseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
