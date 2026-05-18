import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader as Loader2, Plus, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/store/hooks";
import { slugify } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Category } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category_id: z.string().optional(),
  banner_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  is_online: z.boolean().default(false),
  stream_url: z.string().optional(),
  starts_at: z.string().min(1, "Start date required"),
  ends_at: z.string().min(1, "End date required"),
  capacity: z.number().min(0).default(0),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TicketTierInput {
  name: string;
  description: string;
  price: number;
  quantity: number;
  benefits: string;
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [tiers, setTiers] = useState<TicketTierInput[]>([{ name: "General Admission", description: "", price: 0, quantity: 100, benefits: "" }]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_online: false, capacity: 0 },
  });

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => { if (data) setCategories(data); });
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: event, error } = await supabase.from("events").insert({
        ...data,
        organizer_id: user.id,
        slug: slugify(data.title),
        status: "pending",
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        capacity: data.capacity || 0,
      }).select().single();

      if (error) throw error;

      // Create ticket tiers
      if (tiers.length > 0 && event) {
        await supabase.from("ticket_tiers").insert(
          tiers.map((tier) => ({
            event_id: event.id,
            name: tier.name,
            description: tier.description,
            price: tier.price,
            quantity: tier.quantity,
            benefits: tier.benefits ? tier.benefits.split(",").map((b) => b.trim()).filter(Boolean) : [],
          }))
        );
      }

      toast.success("Event created! Pending admin approval.");
      navigate("/organizer/events");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to create event");
    }
    setLoading(false);
  };

  const addTier = () => setTiers([...tiers, { name: "", description: "", price: 0, quantity: 50, benefits: "" }]);
  const removeTier = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i: number, field: keyof TicketTierInput, value: string | number) => {
    const updated = [...tiers];
    updated[i] = { ...updated[i], [field]: value };
    setTiers(updated);
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Create New Event" description="Fill in the details to create your event" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Event Title *</Label>
                <Input placeholder="Enter event title" {...register("title")} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea placeholder="Describe your event..." rows={4} {...register("description")} />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select onValueChange={(v) => setValue("category_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Banner Image URL</Label>
                  <Input placeholder="https://..." {...register("banner_url")} />
                  {errors.banner_url && <p className="text-xs text-red-500">{errors.banner_url.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input placeholder="tech, conference, networking" {...register("tags")} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Date & Time</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date & Time *</Label>
                <Input type="datetime-local" {...register("starts_at")} />
                {errors.starts_at && <p className="text-xs text-red-500">{errors.starts_at.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>End Date & Time *</Label>
                <Input type="datetime-local" {...register("ends_at")} />
                {errors.ends_at && <p className="text-xs text-red-500">{errors.ends_at.message}</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Location</CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Online Event</Label>
                  <Switch
                    checked={isOnline}
                    onCheckedChange={(v) => { setIsOnline(v); setValue("is_online", v); }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isOnline ? (
                <div className="space-y-1.5">
                  <Label>Stream URL</Label>
                  <Input placeholder="https://youtube.com/live/..." {...register("stream_url")} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Venue Name</Label>
                    <Input placeholder="Convention Center" {...register("venue")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address</Label>
                    <Input placeholder="123 Main Street" {...register("address")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input placeholder="San Francisco" {...register("city")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input placeholder="United States" {...register("country")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Capacity</Label>
                    <Input type="number" placeholder="0 for unlimited" {...register("capacity", { valueAsNumber: true })} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Ticket Tiers</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addTier}>
                  <Plus className="w-4 h-4 mr-1" /> Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tiers.map((tier, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Tier {i + 1}</p>
                    {tiers.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeTier(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input placeholder="General Admission" value={tier.name} onChange={(e) => updateTier(i, "name", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price ($)</Label>
                      <Input type="number" placeholder="0" value={tier.price} onChange={(e) => updateTier(i, "price", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="100" value={tier.quantity} onChange={(e) => updateTier(i, "quantity", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Benefits (comma-separated)</Label>
                      <Input placeholder="Front row seating, VIP access" value={tier.benefits} onChange={(e) => updateTier(i, "benefits", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <><Save className="w-4 h-4 mr-2" />Create Event</>}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
