import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useGetEventByIdQuery } from "@/store/api/eventsApi";
import { formatCurrency } from "@/lib/utils";
import type { TicketTier } from "@/types";

const TicketSelectionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event");
  const tierId = searchParams.get("tier");
  const requestedQuantity = Number(searchParams.get("quantity") || "1");

  const { data: event, isLoading } = useGetEventByIdQuery(eventId ?? "", { skip: !eventId });

  const activeTiers = event?.ticket_tiers?.filter((tier) => tier.is_active) ?? [];
  const selectedTier = useMemo<TicketTier | null>(() => {
    if (!tierId) return activeTiers[0] ?? null;
    return activeTiers.find((tier) => tier.id === tierId) ?? null;
  }, [activeTiers, tierId]);

  const defaultLimit = selectedTier ? Math.max(1, Math.min(10, (selectedTier.quantity ?? 1) - (selectedTier.sold ?? 0))) : 10;
  const [quantity, setQuantity] = useState(Math.min(Math.max(1, requestedQuantity || 1), defaultLimit || 10));

  const maxQuantity = selectedTier ? Math.max(1, Math.min(defaultLimit, Math.max(1, selectedTier.quantity - selectedTier.sold))) : 10;

  const handleContinue = () => {
    if (!eventId || !selectedTier) {
      return;
    }

    navigate(`/checkout/payment?event=${eventId}&tier=${selectedTier.id}&quantity=${quantity}`);
  };

  if (!eventId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Missing checkout context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">This checkout flow needs an event id to continue.</p>
            <Button onClick={() => navigate("/events")}>Back to events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 px-0">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" /> Review your booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Event ID</p>
              <p className="font-mono text-sm break-all">{eventId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tier ID</p>
              <p className="font-mono text-sm break-all">{selectedTier?.id ?? tierId ?? "Not selected"}</p>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading event details...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Event</p>
                  <h2 className="text-2xl font-semibold">{event?.title ?? "Event details unavailable"}</h2>
                  {event?.starts_at && <p className="text-sm text-muted-foreground">{new Date(event.starts_at).toLocaleString()}</p>}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Selected ticket</p>
                  {selectedTier ? (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">{selectedTier.name}</p>
                          {selectedTier.description && (
                            <p className="text-sm text-muted-foreground mt-1">{selectedTier.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">{selectedTier.price === 0 ? "Free" : formatCurrency(selectedTier.price)}</Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active tier matched this checkout link.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value || 1);
                    setQuantity(Math.min(Math.max(1, nextValue), maxQuantity));
                  }}
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Up to {maxQuantity} available</p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{selectedTier ? formatCurrency((selectedTier.price ?? 0) * quantity) : "$0.00"}</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleContinue} disabled={!selectedTier}>
              Continue to payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketSelectionPage;