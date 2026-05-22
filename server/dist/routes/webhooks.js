import express, { Router } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
export const webhooksRouter = Router();
const stripe = env.stripeSecretKey
    ? new Stripe(env.stripeSecretKey)
    : null;
webhooksRouter.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe || !env.stripeWebhookSecret) {
        return res.status(503).json({ error: "Stripe not configured" });
    }
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
    }
    catch (err) {
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
            await supabaseAdmin
                .from("bookings")
                .update({ status: "confirmed", stripe_session_id: session.id })
                .eq("id", bookingId);
            const { data: booking } = await supabaseAdmin
                .from("bookings")
                .select("user_id, event_id")
                .eq("id", bookingId)
                .maybeSingle();
            if (booking) {
                await supabaseAdmin.from("notifications").insert({
                    user_id: booking.user_id,
                    title: "Booking confirmed",
                    message: "Your ticket is ready. You can join the live stream when it starts.",
                    type: "booking",
                    link: `/attendee/bookings`,
                });
            }
        }
    }
    res.json({ received: true });
});
