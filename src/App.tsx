import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "@/store";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleRoute from "@/components/layout/RoleRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

import LoginPage from "@/modules/auth/LoginPage";
import RegisterPage from "@/modules/auth/RegisterPage";
import ForgotPasswordPage from "@/modules/auth/ForgotPasswordPage";

import DashboardPage from "@/modules/dashboard/DashboardPage";
import EventsListPage from "@/modules/events/EventsListPage";
import EventDetailPage from "@/modules/events/EventDetailPage";
import CreateEventPage from "@/modules/organizer/CreateEventPage";
import EditEventPage from "@/modules/organizer/EditEventPage";
import OrganizerEventsPage from "@/modules/organizer/OrganizerEventsPage";
import OrganizerPlaceholderPage from "@/modules/organizer/OrganizerPlaceholderPage";
import LandingPage from "@/modules/LandingPage";
import TicketSelectionPage from "@/modules/checkout/TicketSelectionPage";
import PaymentFormPage from "@/modules/checkout/PaymentFormPage";
import AttendeeBookingsPage from "@/modules/attendee/AttendeeBookingsPage";
import PaymentHistoryPage from "@/modules/attendee/PaymentHistoryPage";
import AnalyticsReportsPage from "@/modules/analytics/AnalyticsReportsPage";
import AnalyticsExportsPage from "@/modules/analytics/AnalyticsExportsPage";
import AdminCategoriesPage from "@/modules/admin/AdminCategoriesPage";
import AdminPermissionsPage from "@/modules/admin/AdminPermissionsPage";
import AdminSettingsPage from "@/modules/admin/AdminSettingsPage";
import AdminUsersPage from "@/modules/admin/AdminUsersPage";
import AdminEventsPage from "@/modules/admin/AdminEventsPage";
import StreamPage from "@/modules/stream/StreamPage";
import LiveEventsPage from "@/modules/stream/LiveEventsPage";
import NotificationsPage from "@/modules/notifications/NotificationsPage";
import SponsorPlaceholderPage from "@/modules/sponsor/SponsorPlaceholderPage";
import ProfilePage from "@/modules/profile/ProfilePage";

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

              <Route element={<DashboardLayout />}>
                {/* Attendee discovery — public */}
                <Route path="/events" element={<EventsListPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/landing" element={<LandingPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/events/:id/stream" element={<StreamPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/checkout/ticket-selection" element={<TicketSelectionPage />} />
                  <Route path="/checkout/payment" element={<PaymentFormPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>

                {/* Attendee */}
                <Route element={<RoleRoute roles={["attendee", "admin"]} />}>
                  <Route path="/attendee" element={<Navigate to="/attendee/bookings" replace />} />
                  <Route path="/attendee/bookings" element={<AttendeeBookingsPage />} />
                  <Route path="/attendee/payment-history" element={<PaymentHistoryPage />} />
                </Route>

                {/* Analytics — admin platform + organizer event */}
                <Route element={<RoleRoute roles={["admin", "organizer"]} permission="analytics:event" />}>
                  <Route path="/analytics" element={<Navigate to="/analytics/reports" replace />} />
                  <Route path="/analytics/reports" element={<AnalyticsReportsPage />} />
                  <Route path="/analytics/exports" element={<AnalyticsExportsPage />} />
                </Route>

                {/* Admin — /admin/* */}
                <Route element={<RoleRoute roles={["admin"]} redirectTo="/dashboard" />}>
                  <Route path="/admin" element={<Navigate to="/admin/events" replace />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/permissions" element={<AdminPermissionsPage />} />
                  <Route path="/admin/settings" element={<AdminSettingsPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/events" element={<AdminEventsPage />} />
                </Route>

                {/* Organizer — /organizer/* */}
                <Route element={<RoleRoute roles={["organizer", "admin"]} permission="events:write:own" />}>
                  <Route path="/organizer" element={<Navigate to="/organizer/events" replace />} />
                  <Route path="/organizer/events" element={<OrganizerEventsPage />} />
                  <Route path="/organizer/events/new" element={<CreateEventPage />} />
                  <Route path="/organizer/events/:id/edit" element={<EditEventPage />} />
                  <Route
                    path="/organizer/registrations"
                    element={
                      <OrganizerPlaceholderPage
                        title="Registrations"
                        description="View and manage attendee registrations for your events"
                      />
                    }
                  />
                  <Route
                    path="/organizer/tickets"
                    element={
                      <OrganizerPlaceholderPage
                        title="Ticket management"
                        description="Manage ticket tiers and sales"
                      />
                    }
                  />
                </Route>

                {/* Sponsor — planned modules */}
                <Route element={<RoleRoute roles={["sponsor"]} />}>
                  <Route path="/sponsor" element={<Navigate to="/sponsor/opportunities" replace />} />
                  <Route
                    path="/sponsor/opportunities"
                    element={
                      <SponsorPlaceholderPage
                        title="Sponsorship opportunities"
                        description="Discover events seeking campus sponsors"
                      />
                    }
                  />
                  <Route
                    path="/sponsor/campaigns"
                    element={
                      <SponsorPlaceholderPage
                        title="My campaigns"
                        description="Manage your sponsorship campaigns"
                      />
                    }
                  />
                  <Route
                    path="/sponsor/sponsorships"
                    element={
                      <SponsorPlaceholderPage
                        title="Sponsorships"
                        description="Active and past sponsorship deals"
                      />
                    }
                  />
                </Route>

                {/* Live streams */}
                <Route element={<RoleRoute roles={["attendee", "organizer", "admin", "sponsor"]} permission="streams:join" />}>
                  <Route path="/events/live" element={<LiveEventsPage />} />
                </Route>

                <Route element={<ProtectedRoute roles={["admin", "organizer", "attendee", "sponsor"]} />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                <Route index element={<Navigate to="/events" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/events" replace />} />
            </Routes>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}
