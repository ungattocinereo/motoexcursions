import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const leadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().min(4).max(120),
  date: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().max(1200).optional().or(z.literal('')),
  tourSlug: z.string().trim().min(1).max(80),
  tourTitle: z.string().trim().min(1).max(160),
  pageUrl: z.string().trim().url().max(500),
  honeypot: z.string().optional().default(''),
});

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;

declare global {
  // eslint-disable-next-line no-var
  var __MOTO_LEAD_RATE_LIMIT__: Map<string, { count: number; resetAt: number }> | undefined;
}

const getRateStore = (): Map<string, { count: number; resetAt: number }> => {
  if (!globalThis.__MOTO_LEAD_RATE_LIMIT__) {
    globalThis.__MOTO_LEAD_RATE_LIMIT__ = new Map();
  }
  return globalThis.__MOTO_LEAD_RATE_LIMIT__;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const toShortLine = (value: string | undefined, fallback = '—'): string => {
  if (!value || value.trim() === '') return fallback;
  return escapeHtml(value.trim());
};

const parseRequestBody = async (request: Request): Promise<Record<string, unknown>> => {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await request.json()) as Record<string, unknown>;
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return {};
};

const getClientIp = (request: Request, clientAddress: string | undefined): string => {
  if (clientAddress) return clientAddress;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return 'unknown';
};

const isRateLimited = (ip: string): boolean => {
  const store = getRateStore();
  const now = Date.now();
  const current = store.get(ip);

  if (!current || now > current.resetAt) {
    store.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  store.set(ip, {
    ...current,
    count: current.count + 1,
  });

  return false;
};

const sendToTelegram = async (payload: z.infer<typeof leadSchema>, ip: string): Promise<void> => {
  const botToken = import.meta.env.TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.TELEGRAM_CHAT_ID;
  const threadId = import.meta.env.TELEGRAM_MESSAGE_THREAD_ID;

  if (!botToken || !chatId) {
    throw new Error('Telegram env vars are missing');
  }

  const message = [
    '<b>New tour request</b>',
    `Tour: <b>${toShortLine(payload.tourTitle)}</b> (${toShortLine(payload.tourSlug)})`,
    `Name: ${toShortLine(payload.name)}`,
    `Phone/WhatsApp: ${toShortLine(payload.contact)}`,
    `Date: ${toShortLine(payload.date)}`,
    `Message: ${toShortLine(payload.message)}`,
    `Page: ${toShortLine(payload.pageUrl)}`,
    `IP: ${toShortLine(ip)}`,
  ].join('\n');

  const body = new URLSearchParams({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: 'true',
  });

  if (threadId) {
    body.set('message_thread_id', threadId);
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const telegramBody = await response.text();
    throw new Error(`Telegram request failed (${response.status}): ${telegramBody}`);
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const rawBody = await parseRequestBody(request);
    const parsed = leadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid form payload',
          details: parsed.error.flatten(),
        }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        },
      );
    }

    if (parsed.data.honeypot && parsed.data.honeypot.trim() !== '') {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    const ip = getClientIp(request, clientAddress);

    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    await sendToTelegram(parsed.data, ip);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Could not send lead',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  }
};
