import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, asc } from "drizzle-orm";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const HOTEL_SYSTEM_PROMPT = `You are Aria, the AI concierge for Seed Hotel — a modern boutique 5-star establishment celebrated for its innovative design, sustainable practices, and world-class hospitality.

You help guests with:
- Check-in and checkout information (check-in: 3:00 PM, checkout: 12:00 PM; early/late check-in available upon request)
- Room service (available 24/7, plant-forward menu curated by our executive chef)
- Hotel amenities: rooftop infinity pool (6 AM–11 PM), state-of-the-art fitness center (24/7), full-service wellness spa (8 AM–10 PM), co-working spaces
- Dining: Roots Restaurant (farm-to-table fine dining, 6 PM–11 PM), The Greenhouse Café (all-day dining, 6 AM–midnight), Rooftop Bar (4 PM–1 AM)
- Local attractions, curated city experiences, and private transportation
- Room upgrades, special occasion arrangements, and bespoke requests
- Event spaces and meeting rooms (capacity up to 300)
- Parking (valet available, $55/night; EV charging stations available)
- Pet-friendly policies (up to 2 pets under 30 lbs, $60 fee per night)
- Wi-Fi (complimentary throughout property; premium bandwidth available for guests)
- Sustainability initiatives: zero-waste program, locally sourced amenities, carbon-offset stays

Always be warm, modern, and attentive. Keep a friendly yet refined tone. If you don't know specific details, offer to connect them with the appropriate department.`;

router.get("/", async (req, res) => {
  try {
    const convs = await db
      .select()
      .from(conversations)
      .orderBy(asc(conversations.createdAt));
    res.json(convs);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateOpenaiConversationBody.parse(req.body);
    const [conv] = await db
      .insert(conversations)
      .values({ title: body.title })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetOpenaiConversationParams.parse({
      id: Number(req.params.id),
    });
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteOpenaiConversationParams.parse({
      id: Number(req.params.id),
    });
    const [deleted] = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/messages", async (req, res) => {
  try {
    const { id } = ListOpenaiMessagesParams.parse({
      id: Number(req.params.id),
    });
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/messages", async (req, res) => {
  try {
    const { id } = SendOpenaiMessageParams.parse({
      id: Number(req.params.id),
    });
    const body = SendOpenaiMessageBody.parse(req.body);

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const priorMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: body.content,
    });

    const chatHistory = priorMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    chatHistory.push({ role: "user", content: body.content });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: HOTEL_SYSTEM_PROMPT },
        ...chatHistory,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
