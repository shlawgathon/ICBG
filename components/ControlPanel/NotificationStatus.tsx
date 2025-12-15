"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mail, Send, Check, X, Loader2 } from "lucide-react";

/**
 * Props for the NotificationStatus component.
 */
type NotificationStatusProps = {
  /** Results from notification sending */
  results?: {
    sent: number;
    failed: number;
  };
  /** Whether notifications are being sent */
  isSending: boolean;
  /** Callback to trigger notification sending */
  onSend: () => void;
  /** Whether the send button is disabled */
  disabled?: boolean;
};

/**
 * NotificationStatus displays email delivery tracking and controls.
 * Shows send progress and success/failure counts.
 *
 * @param results - Notification send results
 * @param isSending - Whether sending is in progress
 * @param onSend - Trigger notification sending
 * @param disabled - Whether controls are disabled
 * @returns Notification status card component
 */
export function NotificationStatus({
  results,
  isSending,
  onSend,
  disabled = false,
}: NotificationStatusProps) {
  const total = results ? results.sent + results.failed : 0;
  const successRate = total > 0 ? (results!.sent / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-500" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Send button */}
        <Button
          onClick={onSend}
          disabled={disabled || isSending}
          variant="outline"
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Delivery Notifications
            </>
          )}
        </Button>

        {/* Progress during send */}
        {isSending && (
          <div className="space-y-2">
            <Progress value={50} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Sending emails via AgentMail...
            </p>
          </div>
        )}

        {/* Results display */}
        {results && !isSending && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            {/* Success rate bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Delivery Rate</span>
                <span>{successRate.toFixed(0)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            {/* Counts */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">{results.sent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-3 h-3 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">{results.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

