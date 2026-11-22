import { SeverityNumber } from "@opentelemetry/api-logs";
import { posthogLoggerProvider } from "@/instrumentation";

const posthogLogger = posthogLoggerProvider?.getLogger("posthog-exporter");

type CustomizationLogAttributes = {
  product_slug: string;
  slack_notification_configured?: boolean;
};

export function logCustomizationWorkflow(
  message: string,
  severityNumber: SeverityNumber,
  attributes: CustomizationLogAttributes,
) {
  posthogLogger?.emit({
    body: message,
    severityNumber,
    attributes,
  });
}

export async function flushCustomizationWorkflowLogs() {
  await posthogLoggerProvider?.forceFlush().catch(() => {});
}
