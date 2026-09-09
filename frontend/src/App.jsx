import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import InternDashboard from "./pages/InternDashboard";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "supervisor" ? "/supervisor" : "/intern"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/supervisor"
              element={
                <ProtectedRoute roles={["supervisor"]}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/intern"
              element={
                <ProtectedRoute roles={["intern"]}>
                  <InternDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
