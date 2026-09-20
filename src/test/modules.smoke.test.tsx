import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderModule, mockUser } from "./test-utils";

import LoginPage from "@/modules/auth/LoginPage";
import RegisterPage from "@/modules/auth/RegisterPage";
import ForgotPasswordPage from "@/modules/auth/ForgotPasswordPage";
import DashboardPage from "@/modules/dashboard/DashboardPage";
import EventsListPage from "@/modules/events/EventsListPage";
import EventDetailPage from "@/modules/events/EventDetailPage";
import LandingPage from "@/modules/LandingPage";
import CreateEventPage from "@/modules/organizer/CreateEventPage";
import EditEventPage from "@/modules/organizer/EditEventPage";
import OrganizerEventsPage from "@/modules/organizer/OrganizerEventsPage";
import OrganizerPlaceholderPage from "@/modules/organizer/OrganizerPlaceholderPage";
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

describe("Module smoke tests", () => {
  describe("auth", () => {
    it("LoginPage renders", () => {
      renderModule(<LoginPage />, { route: "/login" });
      expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("RegisterPage renders", () => {
      renderModule(<RegisterPage />, { route: "/register" });
      expect(screen.getByRole("heading", { name: /create.*account|sign up|register/i })).toBeInTheDocument();
    });

    it("ForgotPasswordPage renders", () => {
      renderModule(<ForgotPasswordPage />, { route: "/forgot-password" });
      expect(screen.getByRole("heading", { name: /forgot|reset/i })).toBeInTheDocument();
    });
  });

  describe("public / attendee discovery", () => {
    it("EventsListPage renders", async () => {
      renderModule(<EventsListPage />, { route: "/events" });
      await waitFor(() => {
        expect(screen.getByText(/browse events/i)).toBeInTheDocument();
      });
    });

    it("EventDetailPage renders", async () => {
      renderModule(<EventDetailPage />, {
        route: "/events/test-event-id",
        routePattern: "/events/:id",
      });
      await waitFor(() => {
        expect(
          screen.getByText(/event not found|about this event|get tickets/i)
        ).toBeInTheDocument();
      });
    });

    it("LandingPage renders", () => {
      renderModule(<LandingPage />, { route: "/landing" });
      expect(document.body.textContent?.length).toBeGreaterThan(10);
    });

    it("LiveEventsPage renders", async () => {
      renderModule(<LiveEventsPage />, {
        route: "/events/live",
        user: mockUser("attendee"),
        loading: false,
      });
      await waitFor(() => {
        expect(screen.getByText(/live events/i)).toBeInTheDocument();
      });
    });
  });

  describe("dashboards by role", () => {
    it("DashboardPage — admin", () => {
      renderModule(<DashboardPage />, { user: mockUser("admin"), loading: false });
      expect(document.body.textContent?.length).toBeGreaterThan(20);
    });

    it("DashboardPage — organizer", () => {
      renderModule(<DashboardPage />, { user: mockUser("organizer"), loading: false });
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it("DashboardPage — attendee", () => {
      renderModule(<DashboardPage />, { user: mockUser("attendee"), loading: false });
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
    });

    it("DashboardPage — sponsor", () => {
      renderModule(<DashboardPage />, { user: mockUser("sponsor"), loading: false });
      expect(document.body.textContent?.length).toBeGreaterThan(20);
    });
  });

  describe("organizer", () => {
    const organizer = mockUser("organizer");

    it("OrganizerEventsPage renders", async () => {
      renderModule(<OrganizerEventsPage />, { user: organizer, loading: false });
      await waitFor(() => {
        expect(screen.getByText(/my events/i)).toBeInTheDocument();
      });
    });

    it("CreateEventPage renders", async () => {
      renderModule(<CreateEventPage />, { user: organizer, loading: false });
      await waitFor(() => {
        expect(screen.getByText(/create new event/i)).toBeInTheDocument();
      });
    });

    it("EditEventPage renders", async () => {
      renderModule(<EditEventPage />, {
        route: "/organizer/events/evt-1/edit",
        routePattern: "/organizer/events/:id/edit",
        user: organizer,
        loading: false,
      });
      await waitFor(() => {
        expect(
          screen.getByText(/edit event|event not found/i)
        ).toBeInTheDocument();
      });
    });

    it("OrganizerPlaceholderPage — registrations", () => {
      renderModule(
        <OrganizerPlaceholderPage title="Registrations" description="Reg desc" />,
        { user: organizer, loading: false }
      );
      expect(screen.getByRole("heading", { name: "Registrations" })).toBeInTheDocument();
    });
  });

  describe("admin", () => {
    const admin = mockUser("admin");

    it("AdminEventsPage renders", async () => {
      renderModule(<AdminEventsPage />, { user: admin, loading: false });
      await waitFor(() => {
        expect(screen.getByText(/manage events/i)).toBeInTheDocument();
      });
    });

    it("AdminCategoriesPage renders", async () => {
      renderModule(<AdminCategoriesPage />, { user: admin, loading: false });
      await waitFor(() => {
        expect(screen.getByText(/manage categories/i)).toBeInTheDocument();
      });
    });

    it("AdminPermissionsPage renders", () => {
      renderModule(<AdminPermissionsPage />, { user: admin, loading: false });
      expect(screen.getByText(/role permissions/i)).toBeInTheDocument();
    });

    it("AdminUsersPage renders", async () => {
      renderModule(<AdminUsersPage />, { user: admin, loading: false });
      await waitFor(() => {
        expect(screen.getByText("Manage Users")).toBeInTheDocument();
      });
    });

    it("AdminSettingsPage renders", () => {
      renderModule(<AdminSettingsPage />, { user: admin, loading: false });
      expect(document.body.textContent?.length).toBeGreaterThan(10);
    });
  });

  describe("attendee", () => {
    const attendee = mockUser("attendee");

    it("AttendeeBookingsPage renders", async () => {
      renderModule(<AttendeeBookingsPage />, { user: attendee, loading: false });
      await waitFor(() => {
        expect(screen.getByText(/my bookings/i)).toBeInTheDocument();
      });
    });

    it("PaymentHistoryPage renders", () => {
      renderModule(<PaymentHistoryPage />, { user: attendee, loading: false });
      expect(document.body.textContent?.length).toBeGreaterThan(10);
    });
  });

  describe("checkout", () => {
    it("TicketSelectionPage reads the event and tier from the URL", () => {
      renderModule(<TicketSelectionPage />, {
        route: "/checkout/ticket-selection?event=evt-1&tier=tier-1",
        user: mockUser("attendee"),
        loading: false,
      });

      expect(screen.getByText(/review your booking/i)).toBeInTheDocument();
      expect(screen.getByText(/event id/i)).toBeInTheDocument();
    });

    it("PaymentFormPage renders", () => {
      renderModule(<PaymentFormPage />, {
        user: mockUser("attendee"),
        loading: false,
      });
      expect(document.body.textContent?.length).toBeGreaterThan(10);
    });
  });

  describe("analytics", () => {
    it("AnalyticsReportsPage — admin", async () => {
      renderModule(<AnalyticsReportsPage />, { user: mockUser("admin"), loading: false });
      await waitFor(() => {
        expect(screen.getByText(/platform analytics|event analytics/i)).toBeInTheDocument();
      });
    });

    it("AnalyticsExportsPage renders", () => {
      renderModule(<AnalyticsExportsPage />, { user: mockUser("organizer"), loading: false });
      expect(screen.getByText(/analytics exports/i)).toBeInTheDocument();
    });
  });

  describe("stream & chat", () => {
    it("StreamPage renders", async () => {
      renderModule(<StreamPage />, {
        route: "/events/evt-1/stream",
        routePattern: "/events/:id/stream",
        user: mockUser("organizer"),
        loading: false,
      });
      await waitFor(
        () => {
          expect(
            screen.getByText(/event not found|book a ticket|live campus stream/i)
          ).toBeInTheDocument();
        },
        { timeout: 8000 }
      );
    });
  });

  describe("notifications & profile", () => {
    it("NotificationsPage renders", async () => {
      renderModule(<NotificationsPage />, { user: mockUser("attendee"), loading: false });
      await waitFor(() => {
        expect(screen.getByText(/notification/i)).toBeInTheDocument();
      });
    });

    it("ProfilePage renders", () => {
      renderModule(<ProfilePage />, { user: mockUser("attendee"), loading: false });
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    it("Organizer profile page includes default payment details", () => {
      const organizer = mockUser("organizer", {
        metadata: {
          payment_details: {
            account_name: "Organizer Co",
            bank_name: "North Bank",
            account_number: "123456789",
            wallet_number: "@organizerwallet",
            currency: "USD",
            notes: "Please send a receipt",
          },
        },
      });

      renderModule(<ProfilePage />, { user: organizer, loading: false });
      expect(screen.getByRole("heading", { name: /default payment details/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue("Organizer Co")).toBeInTheDocument();
      expect(screen.getByDisplayValue("North Bank")).toBeInTheDocument();
    });
  });

  describe("sponsor (planned)", () => {
    it("SponsorPlaceholderPage renders", () => {
      renderModule(
        <SponsorPlaceholderPage title="Opportunities" description="Sponsor desc" />,
        { user: mockUser("sponsor"), loading: false }
      );
      expect(screen.getByRole("heading", { name: "Opportunities" })).toBeInTheDocument();
    });
  });
});
