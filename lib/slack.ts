/**
 * Shared Slack API helpers — server-side only.
 * Import only from API routes or server actions.
 * Never exposes the bot token in logs, responses, or client code.
 */

/** Calls the Slack chat.postMessage API. Returns true on success. */
export async function callSlackApi(
  token: string,
  channel: string,
  d: {
    prefix?: string;
    leadId: string;
    productName: string;
    productUrl: string;
    fullName: string;
    businessEmail: string;
    phone: string;
  }
): Promise<boolean> {
  const prefix = d.prefix ?? "";
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel,
        text: `${prefix}🔧 New Customization Request — ${d.productName}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: [
                `${prefix}🔧 *New Customization Request*`,
                `*Product:* <${d.productUrl}|${d.productName}>`,
                `*Name:* ${d.fullName}`,
                `*Email:* ${d.businessEmail}`,
                `*Phone:* ${d.phone}`,
                `*Lead ID:* \`${d.leadId}\``,
              ].join("\n"),
            },
          },
        ],
      }),
    });
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}
