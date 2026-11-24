import { randomUUID } from "node:crypto";
import { emailConfig, escapeEmailHtml, safeEmailUrl } from "./emailConfig";
import { sendEmail, plainTextEmail, type DeliveryResult } from "./emailDelivery";
import { unsubscribeUrl } from "./emailUnsubscribe";

export interface StorySummary {
  title: string;
  source: string;
  region?: string;
  url: string;
  summary?: string;
  publishedAt?: string;
}

async function deliverTemplate(
  message: { to: string; subject: string; html: string },
  kind: string, identity: string, nonEssential = false,
): Promise<DeliveryResult> {
  const config = emailConfig();
  const unsubscribe = nonEssential ? unsubscribeUrl(message.to) : undefined;
  const footer = `<p style="text-align:center;font:12px Arial;color:#777">Need help? <a href="mailto:${escapeEmailHtml(config.supportEmail)}">${escapeEmailHtml(config.supportEmail)}</a>${unsubscribe ? ` · <a href="${escapeEmailHtml(unsubscribe)}">Unsubscribe from news emails</a>` : ""}</p>`;
  const html = message.html.replace("</body>", `${footer}</body>`);
  return sendEmail({
    ...message, html, text: plainTextEmail(html), kind, identity, nonEssential,
    ...(unsubscribe ? { headers: {
      "List-Unsubscribe": `<${unsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    } } : {}),
  });
}

export async function sendWelcomeEmail(to: string, name?: string): Promise<DeliveryResult> {
  const APP_URL = escapeEmailHtml(emailConfig().appUrl);

  const greeting = name ? `Hello ${escapeEmailHtml(name)}` : 'Hello';

  try {
    return await deliverTemplate({
      to,
      subject: "Welcome to LUM News – The world's narratives in your hand",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1E174B 0%, #2D2066 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
            .header p { color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 14px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 20px; color: #1E174B; margin-bottom: 20px; }
            .description { color: #555; font-size: 16px; margin-bottom: 30px; }
            .button { display: inline-block; background: #1E174B; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; }
            .button:hover { background: #2D2066; }
            .footer { background: #f8f8f8; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LUM News</h1>
              <p>The world's narratives in your hand</p>
            </div>
            <div class="content">
              <p class="greeting">${greeting},</p>
              <p class="description">
                Welcome to LUM News! We aggregate the world's most important stories from 30+ trusted news sources, 
                giving you a comprehensive view of global events. Set up your favorite topics and regions to receive 
                personalized news digests tailored just for you.
              </p>
              <p class="description">
                Explore stories across categories like AI & Technology, Politics, Finance, Science, and more. 
                Our polarization insights help you understand different perspectives on the stories that matter.
              </p>
              <p style="text-align: center; margin-top: 30px;">
                <a href="${APP_URL}/home" class="button">Open LUM News</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} LUM News. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }, "welcome", "registration");
  } catch (error) {
    console.error('[EmailService] Failed to send welcome email:', error);
    throw error;
  }
}

export async function sendLoginNotificationEmail(to: string, name?: string, eventId: string = randomUUID(), registration = false): Promise<DeliveryResult> {
  const APP_URL = escapeEmailHtml(emailConfig().appUrl);

  const greeting = name ? `Hi ${escapeEmailHtml(name)}` : 'Hi there';
  const loginTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  try {
    return await deliverTemplate({
      to,
      subject: 'Welcome to LUM News',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1E174B 0%, #2D2066 100%); padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 30px; }
            .greeting { font-size: 18px; color: #1E174B; margin-bottom: 15px; }
            .info-box { background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { color: #888; font-size: 14px; min-width: 80px; }
            .info-value { color: #333; font-size: 14px; font-weight: 500; }
            .notice { color: #666; font-size: 14px; margin-top: 20px; }
            .button { display: inline-block; background: #1E174B; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; }
            .footer { background: #f8f8f8; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LUM News</h1>
            </div>
            <div class="content">
              <p class="greeting">${greeting},</p>
              <p>${registration ? 'Welcome to LUM News! We are glad you have joined our community of curious readers.' : 'Welcome back to LUM News! We are glad to see you again.'}</p>
              <p>${registration ? 'Your LUM News account was created and you signed in successfully.' : 'There has been a successful login to your LUM News account.'}</p>
              <p>Explore the latest stories from publishers around the world, follow the topics that matter to you, and save articles to read later.</p>
              <p>Make LUM News your own by choosing your favourite topics and regions in <a href="${APP_URL}/settings">Settings</a>. Open an article to read its AI-powered summary when available, or follow the original publisher link for the full story.</p>
              <p>Thank you for choosing LUM News. We hope you discover something worth reading today.</p>
              <div class="info-box">
                <div style="margin-bottom: 8px;">
                  <span style="color: #888; font-size: 14px;">Time: </span>
                  <span style="color: #333; font-size: 14px; font-weight: 500;">${loginTime}</span>
                </div>
              </div>
              <p class="notice">
                If this was you, no action is needed. If you didn't sign in, please secure your account immediately.
              </p>
              <p style="margin-top: 25px;">
                <a href="${APP_URL}/home" class="button">Go to LUM News</a>
              </p>
            </div>
            <div class="footer">
              <p>This account-security notification is sent after every successful login or registration. Your news-email preferences do not affect it.</p>
              <p>&copy; ${new Date().getFullYear()} LUM News. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }, "login", eventId);
  } catch (error) {
    console.error('[EmailService] Login notification failed.');
    throw error;
  }
}

export async function sendTopicDigestEmail(
  to: string,
  name: string,
  topics: string[],
  stories: StorySummary[],
  options: { kind?: "digest" | "personalized" | "breaking"; period?: string } = {},
): Promise<DeliveryResult | "empty"> {
  const APP_URL = escapeEmailHtml(emailConfig().appUrl);

  if (stories.length === 0) {
    return "empty";
  }

  const topicsList = topics.join(', ');
  const storiesHtml = stories.map(story => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
        <a href="${escapeEmailHtml(safeEmailUrl(story.url))}" style="color: #1E174B; font-size: 16px; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">
          ${escapeEmailHtml(story.title)}
        </a>
        <div style="color: #888; font-size: 12px; margin-bottom: 6px;">
          ${escapeEmailHtml(story.source)}${story.region ? ` • ${escapeEmailHtml(story.region)}` : ''}${story.publishedAt ? ` • ${escapeEmailHtml(new Date(story.publishedAt).toLocaleDateString())}` : ''}
        </div>
        ${story.summary ? `<p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5;">${escapeEmailHtml(story.summary.substring(0, 200))}${story.summary.length > 200 ? '...' : ''}</p>` : ''}
      </td>
    </tr>
  `).join('');

  try {
    return await deliverTemplate({
      to,
      subject: options.kind === "breaking" ? `LUM News breaking alert – ${topicsList}` : `Your LUM News update – Stories about ${topicsList}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1E174B 0%, #2D2066 100%); padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 30px; }
            .greeting { font-size: 18px; color: #1E174B; margin-bottom: 10px; }
            .intro { color: #555; font-size: 14px; margin-bottom: 25px; }
            .topics-badge { display: inline-block; background: #f0eef8; color: #1E174B; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin: 2px; }
            .footer { background: #f8f8f8; padding: 20px 30px; text-align: center; }
            .footer a { color: #1E174B; text-decoration: none; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${options.kind === "breaking" ? "Breaking News" : "Your News Digest"}</h1>
            </div>
            <div class="content">
              <p class="greeting">Hi ${escapeEmailHtml(name)},</p>
              <p class="intro">
                Here are today's top stories for the topics you follow:
                ${topics.map(t => `<span class="topics-badge">${escapeEmailHtml(t)}</span>`).join(' ')}
              </p>
              <table style="width: 100%; border-collapse: collapse;">
                ${storiesHtml}
              </table>
            </div>
            <div class="footer">
              <a href="${APP_URL}/settings">Manage your topics</a>
              <p style="color: #888; font-size: 12px; margin-top: 15px;">&copy; ${new Date().getFullYear()} LUM News</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }, options.kind || "digest", options.period || new Date().toISOString().slice(0, 10), true);
  } catch (error) {
    console.error('[EmailService] Failed to send topic digest email:', error);
    throw error;
  }
}
