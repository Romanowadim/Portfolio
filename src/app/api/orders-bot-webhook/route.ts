import { NextResponse } from "next/server";
import { getOrderByMessageId } from "@/lib/orders-bot";
import { sendEmail } from "@/lib/mailer";

const BOT_TOKEN = process.env.ORDERS_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: Request) {
  try {
    const update = await req.json();

    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    // Only process replies from the admin chat
    if (String(message.chat?.id) !== CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    // Must be a reply to a bot message
    const replyTo = message.reply_to_message;
    if (!replyTo) return NextResponse.json({ ok: true });

    const replyMessageId = String(replyTo.message_id);
    const order = await getOrderByMessageId(replyMessageId);

    if (!order) {
      await sendBotMessage("⚠️ Could not find the order for this message.");
      return NextResponse.json({ ok: true });
    }

    const text = message.text;
    if (!text) return NextResponse.json({ ok: true });

    const sent = await sendEmail(
      order.email,
      `Re: Your order — ${order.name}`,
      text
    );

    if (sent) {
      await sendBotMessage(`✅ Email sent to <b>${order.email}</b>`);
    } else {
      await sendBotMessage(`❌ Failed to send email to ${order.email}. Check SMTP settings.`);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

async function sendBotMessage(text: string) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
  });
}
