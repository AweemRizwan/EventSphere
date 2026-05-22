import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader as Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toDatetimeLocalInput } from "@/lib/events";
import {
  useGetCategoriesQuery,
  useGetEventByIdQuery,
  useUpdateEventMutation,
} from "@/store/api/eventsApi";
import { useAppSelector } from "@/store/hooks";
import { slugify } from "@/lib/utils";
import toast from "react-hot-toast";
import type { EventStatus } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category_id: z.string().optional(),
  banner_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  is_online: z.boolean(),
  stream_url: z.string().optional(),
  starts_at: z.string().min(1, "Start date required"),
  ends_at: z.string().min(1, "End date required"),
  capacity: z.number().min(0),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: event, isLoading: pageLoading, isError } = useGetEventByIdQuery(id!, { skip: !id });
  const [updateEvent] = useUpdateEventMutation();
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [eventStatus, setEventStatus] = useState<EventStatus>("draft");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_online: false, capacity: 0 },
  });

  useEffect(() => {
    if (!event || !user) return;
    if (event.organizer_id !== user.id) {
      toast.error("Event not found");
      navigate("/organizer/events");
      return;
    }
    setEventStatus(event.status);
    setIsOnline(event.is_online);
    reset({
      title: event.title,
      description: event.description
        .split("\n\nLocation:")[0]
        .split("\n\nOnline stream:")[0]
        .split("\n\nSchedule:")[0]
        .trim(),
      category_id: event.category_id ?? undefined,
      banner_url: event.banner_url || "",
      venue: event.venue,
      address: event.address,
      city: event.city,
      country: event.country,
      is_online: event.is_online,
      stream_url: event.stream_url,
      starts_at: toDatetimeLocalInput(event.starts_at),
      ends_at: toDatetimeLocalInput(event.ends_at),
      capacity: event.capacity,
      tags: event.tags?.join(", ") ?? "",
    });
  }, [event, user, navigate, reset]);

  useEffect(() => {
    if (isError) {
      toast.error("Event not found");
      navigate("/organizer/events");
    }
  }, [isError, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!user || !id) return;
    setLoading(true);
    try {
      await updateEvent({
        data,
        organizerId: user.id,
        slug: slugify(data.title),
        eventId: id,
        status: eventStatus,
      }).unwrap();
      toast.success("Event updated");
      navigate("/organizer/events");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update event");
    }
    setLoading(false);
  };

  if (pageLoading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit Event" description="Update your event details" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Event Title *</Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea rows={4} {...register("description")} />
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
                <Input {...register("banner_url")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input {...register("tags")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Date & Time</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start *</Label>
              <Input type="datetime-local" {...register("starts_at")} />
            </div>
            <div className="space-y-1.5">
              <Label>End *</Label>
              <Input type="datetime-local" {...register("ends_at")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Location</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Online Event</Label>
                <Switch checked={isOnline} onCheckedChange={(v) => { setIsOnline(v); setValue("is_online", v); }} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isOnline ? (
              <Input placeholder="Stream URL" {...register("stream_url")} />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Input placeholder="Venue" {...register("venue")} /></div>
                <Input placeholder="Address" {...register("address")} />
                <Input placeholder="City" {...register("city")} />
                <Input placeholder="Country" {...register("country")} />
                <Input type="number" placeholder="Capacity" {...register("capacity", { valueAsNumber: true })} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
