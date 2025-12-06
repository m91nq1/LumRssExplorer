import { Resend } from 'resend';

export interface StorySummary {
  title: string;
  source: string;
  region?: string;
  url: string;
  summary?: string;
  publishedAt?: string;
}

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EmailService] RESEND_API_KEY not configured - emails will be skipped');
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = 'LUM News <onboarding@resend.dev>';
const APP_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : 'https://lumnews.app';

export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const greeting = name ? `Hello ${name}` : 'Hello';

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to LUM News – The world's narratives in your hand",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
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
    });
    console.log(`[EmailService] Welcome email sent to ${to}`);
  } catch (error) {
    console.error('[EmailService] Failed to send welcome email:', error);
  }
}

export async function sendTopicDigestEmail(
  to: string,
  name: string,
  topics: string[],
  stories: StorySummary[]
): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  if (stories.length === 0) {
    console.log(`[EmailService] No stories for digest, skipping email to ${to}`);
    return;
  }

  const topicsList = topics.join(', ');
  const storiesHtml = stories.map(story => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
        <a href="${story.url}" style="color: #1E174B; font-size: 16px; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">
          ${story.title}
        </a>
        <div style="color: #888; font-size: 12px; margin-bottom: 6px;">
          ${story.source}${story.region ? ` • ${story.region}` : ''}${story.publishedAt ? ` • ${new Date(story.publishedAt).toLocaleDateString()}` : ''}
        </div>
        ${story.summary ? `<p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5;">${story.summary.substring(0, 200)}${story.summary.length > 200 ? '...' : ''}</p>` : ''}
      </td>
    </tr>
  `).join('');

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your LUM News update – Stories about ${topicsList}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
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
              <h1>Your Daily News Digest</h1>
            </div>
            <div class="content">
              <p class="greeting">Hi ${name},</p>
              <p class="intro">
                Here are today's top stories for the topics you follow:
                ${topics.map(t => `<span class="topics-badge">${t}</span>`).join(' ')}
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
    });
    console.log(`[EmailService] Topic digest sent to ${to} with ${stories.length} stories`);
  } catch (error) {
    console.error('[EmailService] Failed to send topic digest email:', error);
  }
}
