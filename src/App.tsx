import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import Toaster from "react-hot-toast";
import { store } from "@/store";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

import LoginPage from "@/modules/auth/LoginPage";
import RegisterPage from "@/modules/auth/RegisterPage";
import ForgotPasswordPage from "@/modules/auth/ForgotPasswordPage";

import DashboardPage from "@/modules/dashboard/DashboardPage";
import EventsListPage from "@/modules/events/EventsListPage";
import EventDetailPage from "@/modules/events/EventDetailPage";

import CreateEventPage from "@/modules/organizer/CreateEventPage";
import OrganizerEventsPage from "@/modules/organizer/OrganizerEventsPage";

import AdminUsersPage from "@/modules/admin/AdminUsersPage";
import AdminEventsPage from "@/modules/admin/AdminEventsPage";

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />

                  <Route path="/organizer/events" element={<OrganizerEventsPage />} />
                  <Route path="/organizer/events/new" element={<CreateEventPage />} />

                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/events" element={<AdminEventsPage />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}
