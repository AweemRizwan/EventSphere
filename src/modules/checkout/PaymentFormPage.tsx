import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetEventByIdQuery } from "@/store/api/eventsApi";
import { useAppSelector } from "@/store/hooks";
import { formatCurrency } from "@/lib/utils";
import { createManualBooking } from "@/lib/manual-bookings";
import toast from "react-hot-toast";

const PaymentFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const eventId = searchParams.get("event");
  const tierId = searchParams.get("tier");
  const quantity = Number(searchParams.get("quantity") || "1");
  const { data: eventDetails } = useGetEventByIdQuery(eventId ?? "", { skip: !eventId });

  const selectedTier = useMemo(() => {
    return eventDetails?.ticket_tiers?.find((tier) => tier.id === tierId) ?? null;
  }, [eventDetails, tierId]);

  const [form, setForm] = useState({
    paymentMethod: "Bank transfer",
    contactDetails: "",
    paymentProof: "",
    receiptNote: "",
  });
  const paymentProofInputRef = useRef<HTMLInputElement | null>(null);

  const organizerPaymentDetails = useMemo(() => {
    const metadataPaymentDetails = (eventDetails as { metadata?: { payment_details?: Record<string, string> } } | null)?.metadata?.payment_details ?? {};
    return {
      account_name: metadataPaymentDetails.account_name || "EventSphere Ticket Desk",
      bank_name: metadataPaymentDetails.bank_name || "Trust Bank",
      account_number: metadataPaymentDetails.account_number || "9876 5432 10",
      wallet_number: metadataPaymentDetails.wallet_number || "",
      currency: metadataPaymentDetails.currency || "USD",
      notes: metadataPaymentDetails.notes || "Please mention your ticket name and event title when paying.",
    };
  }, [eventDetails]);

  const total = (selectedTier?.price ?? 0) * Math.max(1, quantity || 1);

  const handlePaymentProofUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image for the receipt or payment screenshot.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, paymentProof: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();

    if (!eventId || !selectedTier || !user) {
      toast.error("Your checkout session is incomplete. Please log in and try again.");
      return;
    }

    if (!form.contactDetails.trim()) {
      toast.error("Please provide a contact number or WhatsApp details for payment confirmation.");
      return;
    }

    try {
      const booking = await createManualBooking({
        user_id: user.id,
        event_id: eventId,
        event_title: eventDetails?.title ?? "Event ticket",
        ticket_name: selectedTier.name,
        total_amount: total,
        currency: "USD",
        quantity: Math.max(1, quantity || 1),
        payment_method: form.paymentMethod,
        contact_details: form.contactDetails,
        payment_proof: form.paymentProof || "Screenshot not uploaded yet",
        receipt_note: form.receiptNote,
      });

      toast.success(`Payment submitted for review. Ticket number: ${booking.ticket_number}`);
      navigate(`/attendee/bookings`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit your payment proof right now."
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Payment details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="font-semibold mb-2">Pay using this manual transfer detail</p>
              <ul className="space-y-1 text-amber-900 dark:text-amber-100">
                <li><strong>Account Name:</strong> {organizerPaymentDetails.account_name}</li>
                <li><strong>Bank:</strong> {organizerPaymentDetails.bank_name}</li>
                <li><strong>Account / Mobile Wallet:</strong> {organizerPaymentDetails.account_number || organizerPaymentDetails.wallet_number}</li>
                {organizerPaymentDetails.wallet_number && (
                  <li><strong>Wallet:</strong> {organizerPaymentDetails.wallet_number}</li>
                )}
                <li><strong>Currency:</strong> {organizerPaymentDetails.currency}</li>
                <li><strong>Reference:</strong> {eventDetails?.title ?? "Event ticket"}</li>
              </ul>
              {organizerPaymentDetails.notes && (
                <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">{organizerPaymentDetails.notes}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Selected ticket</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{selectedTier?.name ?? "Custom ticket"}</p>
                  <p className="text-sm text-muted-foreground">Qty: {Math.max(1, quantity || 1)}</p>
                </div>
                <p className="font-semibold">{formatCurrency(total)}</p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Amount to pay</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Event</p>
              <p className="font-medium">{eventDetails?.title ?? "Selected event"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" /> Submit payment proof
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Mobile wallet">Mobile wallet</option>
                  <option value="Cash deposit">Cash deposit</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact / WhatsApp number</label>
                <Input
                  value={form.contactDetails}
                  onChange={(event) => setForm((current) => ({ ...current, contactDetails: event.target.value }))}
                  placeholder="+1 555 123 4567"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Receipt or screenshot</label>
                <div className="flex gap-2">
                  <Input
                    value={form.paymentProof}
                    onChange={(event) => setForm((current) => ({ ...current, paymentProof: event.target.value }))}
                    placeholder="https://... or upload a screenshot"
                  />
                  <Button type="button" variant="outline" onClick={() => paymentProofInputRef.current?.click()}>
                    Upload
                  </Button>
                </div>
                <input
                  ref={paymentProofInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePaymentProofUpload}
                />
                {form.paymentProof.startsWith("data:image/") && (
                  <img
                    src={form.paymentProof}
                    alt="Payment proof preview"
                    className="mt-2 h-40 w-full rounded-md border object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Any extra payment note</label>
                <Input
                  value={form.receiptNote}
                  onChange={(event) => setForm((current) => ({ ...current, receiptNote: event.target.value }))}
                  placeholder="Example: Paid using account ending 3210"
                />
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircleMore className="h-4 w-4" />
                  <span className="font-medium">Share the proof on this contact</span>
                </div>
                <p>Send the receipt screenshot and your booked ticket number to the contact above for organizer verification.</p>
              </div>

              <Button type="submit" className="w-full">Submit payment proof</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFormPage;