import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateProfile } from "@/store/slices/authSlice";
import { getInitials } from "@/lib/utils";
import type { OrganizerPaymentDetails } from "@/types";

const defaultPaymentDetails: OrganizerPaymentDetails = {
  account_name: "EventSphere Ticket Desk",
  bank_name: "Trust Bank",
  account_number: "9876 5432 10",
  wallet_number: "",
  currency: "USD",
  notes: "Please mention your ticket name and event title when paying.",
};

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<OrganizerPaymentDetails>(defaultPaymentDetails);

  useEffect(() => {
    if (!user?.metadata?.payment_details) return;
    setPaymentDetails({ ...defaultPaymentDetails, ...user.metadata.payment_details });
  }, [user?.id, user?.metadata]);

  const handleSavePaymentDetails = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await dispatch(updateProfile({
        id: user.id,
        metadata: { payment_details: paymentDetails },
      })).unwrap();
      toast.success("Default payment details saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save payment details";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile" description="Your EventSphere account" />
      <Card>
        <CardContent className="p-6 flex gap-4 items-start">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2 min-w-0">
            <h2 className="font-semibold text-lg">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            {user.company && (
              <p className="text-sm text-muted-foreground">{user.company}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {(user.role === "organizer" || user.role === "admin") && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Default payment details</h3>
              <p className="text-sm text-muted-foreground">
                These values are auto-filled when you create a new event.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Account name</Label>
                <Input value={paymentDetails.account_name} onChange={(event) => setPaymentDetails((current) => ({ ...current, account_name: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Bank name</Label>
                <Input value={paymentDetails.bank_name} onChange={(event) => setPaymentDetails((current) => ({ ...current, bank_name: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Account / wallet number</Label>
                <Input value={paymentDetails.account_number} onChange={(event) => setPaymentDetails((current) => ({ ...current, account_number: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Alternative wallet number</Label>
                <Input value={paymentDetails.wallet_number} onChange={(event) => setPaymentDetails((current) => ({ ...current, wallet_number: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={paymentDetails.currency} onChange={(event) => setPaymentDetails((current) => ({ ...current, currency: event.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Payment instructions</Label>
                <Textarea rows={3} value={paymentDetails.notes} onChange={(event) => setPaymentDetails((current) => ({ ...current, notes: event.target.value }))} />
              </div>
            </div>

            <Button onClick={handleSavePaymentDetails} disabled={saving}>
              {saving ? "Saving..." : "Save default payment details"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
