import Dedalus, { DedalusRunner } from "dedalus-labs";
import type { SendNotificationsResponse } from "./types";

/**
 * Dedalus client instance for email notifications.
 */
const client = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY!
});

/**
 * DedalusRunner instance for email notification workflows.
 */
const runner = new DedalusRunner(client);

/**
 * Generates festive HTML email body for delivery notifications.
 *
 * @param recipientName - Name of the gift recipient
 * @param address - Delivery address
 * @param estimatedDelivery - Expected delivery date range
 * @returns Formatted HTML email body
 */
export function generateNotificationEmailBody(
  recipientName: string,
  address: string,
  estimatedDelivery: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #c41e3a; text-align: center; margin-bottom: 24px;">
      🎄 Special Delivery Incoming! 🎄
    </h1>
    
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Dear ${recipientName},
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Ho ho ho! Great news from the North Pole!
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Santa's elves have prepared something special just for you, and it's being 
      loaded onto the sleigh as we speak. Your gift will be delivered to:
    </p>
    
    <div style="background: linear-gradient(135deg, #228b22 0%, #1a6b1a 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <p style="color: white; font-size: 16px; font-weight: bold; margin: 0;">
        📍 ${address}
      </p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      <strong>Expected arrival:</strong> ${estimatedDelivery}
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Keep an eye on the sky and listen for sleigh bells! 🔔
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #c41e3a;">
      <p style="font-size: 14px; color: #666; margin-bottom: 8px;">
        With holiday cheer,
      </p>
      <p style="font-size: 18px; color: #c41e3a; font-style: italic; margin: 0;">
        🎅 Santa's Workshop
      </p>
    </div>
  </div>
  
  <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
    This is an automated message from Santa's Logistics Operations (ICBG)
  </p>
</body>
</html>
  `.trim();
}

/**
 * Parses the notification results from AI output.
 *
 * @param output - Raw output from the AI agent
 * @returns Parsed notification response
 */
function parseNotificationResults(output: string): SendNotificationsResponse {
  const jsonMatch = output.match(/\{[\s\S]*"results"[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn("No JSON results found in notification response");
    return { sent: 0, failed: 0, results: [] };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const results = parsed.results || [];
    return {
      sent: results.filter((r: { status: string }) => r.status === "sent").length,
      failed: results.filter((r: { status: string }) => r.status === "failed").length,
      results
    };
  } catch (error) {
    console.error("Failed to parse notification results:", error);
    return { sent: 0, failed: 0, results: [] };
  }
}

/**
 * Sends festive delivery notification emails via AgentMail MCP server.
 * Each recipient receives a personalized email announcing their gift delivery.
 *
 * @param recipients - Array of notification recipients with email and address info
 * @param estimatedDelivery - Expected delivery date string
 * @returns Promise resolving to send results for each recipient
 */
export async function sendDeliveryNotifications(
  recipients: Array<{ email: string; name: string; address: string }>,
  estimatedDelivery: string = "December 23-24, 2025"
): Promise<SendNotificationsResponse> {
  if (recipients.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const prompt = `
You are Santa's notification coordinator. Send festive email notifications
to the following recipients announcing their gift deliveries.

For each recipient, use the AgentMail tools to send an email with:
- To: The recipient's email address
- Subject: "🎅 Santa's Delivering Your Present!"
- Body: A warm, HTML-formatted festive message including:
  - A greeting with their name
  - Announcement that a special gift is on the way
  - Their delivery address
  - Estimated delivery: ${estimatedDelivery}
  - Signed "With holiday cheer, Santa's Workshop"

Recipients to notify:
${recipients
  .map(
    (r) => `
- Name: ${r.name}
- Email: ${r.email}
- Address: ${r.address}
`
  )
  .join("\n")}

After sending all emails, report back the status of each send operation
in JSON format:
{
  "results": [
    { "email": "user@example.com", "status": "sent" },
    { "email": "other@example.com", "status": "failed", "error": "reason" }
  ]
}
`.trim();

  try {
    const result = await runner.run({
      input: prompt,
      model: "openai/gpt-4o-mini",
      mcpServers: ["vroom08/agentmail-mcp"]
    });

    return parseNotificationResults(result.finalOutput);
  } catch (error) {
    console.error("Email notification error:", error);
    return {
      sent: 0,
      failed: recipients.length,
      results: recipients.map((r) => ({
        email: r.email,
        status: "failed" as const,
        error: "MCP server unavailable"
      }))
    };
  }
}

/**
 * Validates an email address format.
 *
 * @param email - Email address to validate
 * @returns true if valid format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates an array of recipients for email notifications.
 *
 * @param recipients - Array of recipients to validate
 * @returns Object with valid recipients and invalid emails
 */
export function validateRecipients(recipients: Array<{ email: string; name: string; address: string }>): {
  valid: Array<{ email: string; name: string; address: string }>;
  invalid: string[];
} {
  const valid: Array<{ email: string; name: string; address: string }> = [];
  const invalid: string[] = [];

  for (const recipient of recipients) {
    if (isValidEmail(recipient.email)) {
      valid.push(recipient);
    } else {
      invalid.push(recipient.email);
    }
  }

  return { valid, invalid };
}
