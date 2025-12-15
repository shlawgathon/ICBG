import { NextResponse } from "next/server";
import {
  sendDeliveryNotifications,
  validateRecipients,
} from "@/lib/agentmail";
import type {
  SendNotificationsRequest,
  SendNotificationsResponse,
  APIError,
} from "@/lib/types";

/** Maximum recipients per request */
const MAX_RECIPIENTS = 50;

/**
 * POST /api/notifications/send
 *
 * Sends festive delivery notification emails to recipients via AgentMail.
 * Each recipient receives a personalized email announcing their gift delivery.
 *
 * @param request - Request containing recipients array and optional metadata
 * @returns JSON response with send results for each recipient
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: SendNotificationsRequest = await request.json();
    const { recipients, estimatedDelivery } = body;

    // Validate recipients array
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      const error: APIError = {
        code: "INVALID_RECIPIENTS",
        message: "Request must contain a non-empty array of recipients",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Enforce limit
    if (recipients.length > MAX_RECIPIENTS) {
      const error: APIError = {
        code: "TOO_MANY_RECIPIENTS",
        message: `Maximum ${MAX_RECIPIENTS} recipients per request`,
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate recipient data structure
    const invalidRecipients = recipients.filter(
      (r) => !r.email || !r.name || !r.address
    );
    if (invalidRecipients.length > 0) {
      const error: APIError = {
        code: "INVALID_RECIPIENT_DATA",
        message:
          "Each recipient must have email, name, and address properties",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate email formats
    const { valid: validRecipients, invalid: invalidEmails } =
      validateRecipients(recipients);

    // Send notifications to valid recipients
    let response: SendNotificationsResponse;

    if (validRecipients.length > 0) {
      response = await sendDeliveryNotifications(
        validRecipients,
        estimatedDelivery
      );

      // Add invalid emails to failed results
      if (invalidEmails.length > 0) {
        response.failed += invalidEmails.length;
        response.results.push(
          ...invalidEmails.map((email) => ({
            email,
            status: "failed" as const,
            error: "Invalid email format",
          }))
        );
      }
    } else {
      response = {
        sent: 0,
        failed: invalidEmails.length,
        results: invalidEmails.map((email) => ({
          email,
          status: "failed" as const,
          error: "Invalid email format",
        })),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Notification send error:", error);

    const apiError: APIError = {
      code: "INTERNAL_ERROR",
      message: "Failed to send notification emails",
      details:
        process.env.NODE_ENV === "development"
          ? { error: String(error) }
          : undefined,
    };
    return NextResponse.json(apiError, { status: 500 });
  }
}

