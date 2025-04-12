import "dotenv/config";

import db from "./db/index.js";
import * as schema from "./db/schema.js";
import { and, eq } from "drizzle-orm";
import { Markup, Telegraf } from "telegraf";
import { v7 as uuid } from "uuid";
import log from "./logger.js";
import { BangumiMoeSource } from "./source/bangumi.js";
import { AcgRipRssSource, DmhyRssSource, NyaaRssSource } from "./source/rss.js";

const sleep = (s: number, reason: string) => {
  log.debug(`sleeping for ${s} seconds since ${reason}`);
  return new Promise((r) => setTimeout(r, s * 1000));
};

const bot = new Telegraf(process.env["TELEGRAM_BOT_TOKEN"] ?? "");
bot.start(async (ctx) => {
  log.info("User started bot", { telegramId: ctx.from.id });
  if (
    !(await db.query.user.findFirst({
      where: eq(schema.user.telegramId, ctx.from.id),
    }))
  ) {
    await db.insert(schema.user).values({
      id: uuid(),
      telegramId: ctx.from.id,
    });
  }
  await ctx.reply("Welcome to AList AutoDL bot!");
});
bot.help((ctx) => ctx.reply("Try /list, /add, /disable"));
bot.command("list", async (ctx) => {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.telegramId, ctx.from.id),
  });
  if (!user) {
    return ctx.reply("You are not registered.");
  }
  const subscriptions = await db.query.subscription.findMany({
    where: eq(schema.subscription.userId, user.id),
  });
  if (subscriptions.length === 0) {
    return ctx.reply("You have no subscriptions.");
  }
  return ctx.reply(
    subscriptions
      .map(
        (sub) =>
          `Source: ${sub.id}\nFilter: ${sub.filter}\nEnabled: ${
            sub.enabled ? "Yes" : "No"
          }`
      )
      .join("\n\n")
  );
});
bot.command("add", async (ctx) => {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.telegramId, ctx.from.id),
  });
  if (!user) {
    return ctx.reply("You are not registered.");
  }
  const filters = ctx.message.text.split(" ").slice(1);
  if (!filters || filters.length === 0) {
    return ctx.reply("Usage: /add <filter>");
  }
  await db.insert(schema.subscription).values({
    id: uuid(),
    userId: user.id,
    filter: filters.join(" "),
  });
  return ctx.reply("Subscription added!");
});
bot.command("del", async (ctx) => {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.telegramId, ctx.from.id),
  });
  if (!user) {
    return ctx.reply("You are not registered.");
  }
  const [, id] = ctx.message.text.split(" ");
  if (!id) {
    return ctx.reply("Usage: /del <id>");
  }
  await db.delete(schema.subscription).where(eq(schema.subscription.id, id));
  return ctx.reply("Subscription deleted!");
});

(async () => {
  const sources = [
    new AcgRipRssSource(),
    new BangumiMoeSource(),
    new DmhyRssSource(),
    new NyaaRssSource(),
  ];
  while (true) {
    // await sleep(5 * 60 * 1000, "initial sleep");
    try {
      const subscriptions = await db.query.subscription.findMany({
        with: { user: true },
      });
      for (const source of sources) {
        log.info(`Processing source ${source.name}`);
        const torrents = await source.getPage(1);
        for (const torrent of torrents) {
          log.info(`Found torrent ${torrent.title}: ${torrent.source_link}`);
          for (const subscription of subscriptions) {
            if (
              subscription.filter
                .split(" ")
                .every((f) => torrent.title.includes(f)) &&
              torrent.info_hash
            ) {
              log.info(
                `Processing torrent for subscription ${subscription.id}`
              );
              const existing = await db.query.processHistory.findFirst({
                where: and(
                  eq(schema.processHistory.infoHash, torrent.info_hash),
                  eq(schema.processHistory.subscriptionId, subscription.id)
                ),
              });
              if (existing) {
                log.info(`Ignoring handled ${existing.id}`);
                continue;
              }
              log.info(
                `Send Telegram message to ${subscription.user.id}:${subscription.user.telegramId}`
              );
              await bot.telegram.sendMessage(
                subscription.user.telegramId,
                `Found torrent: ${torrent.title} ${torrent.info_hash}`,
                Markup.inlineKeyboard([
                  Markup.button.url("Source", torrent.source_link),
                  Markup.button.url("Torrent", torrent.torrent_link),
                  Markup.button.url(
                    "PikPak",
                    `https://mypikpak.com/drive/url-checker?url=${encodeURIComponent(
                      torrent.torrent_link
                    )}`
                  ),
                ])
              );
              await db.insert(schema.processHistory).values({
                id: uuid(),
                subscriptionId: subscription.id,
                infoHash: torrent.info_hash,
                proccessedAt: new Date(),
              });
            }
          }
        }
      }
      log.info(`Finished processing`);
    } catch (e) {
      log.error(e);
    }

    await sleep(600, "interval between fetch");
  }
})().catch(log.error);

log.info("Bot started");
bot.launch().catch(console.error);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
