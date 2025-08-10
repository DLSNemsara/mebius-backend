import express from "express";
import { handleWebhook } from "../application/payment";

export const paymentsRouter = express.Router();

// Webhook endpoint - needs raw body for signature verification
paymentsRouter
  .route("/webhook")
  .post(express.raw({ type: "application/json" }), handleWebhook);
