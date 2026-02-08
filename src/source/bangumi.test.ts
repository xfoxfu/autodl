import { BangumiMoeSource } from "./bangumi.js";
import test from "ava";
import fs from "fs/promises";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
  http.get("https://bangumi.moe/api/torrent/page/1", async () => {
    return HttpResponse.text(
      (await fs.readFile("assets/test/bangumi.json")).toString(),
    );
  }),
);

test.before(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.after(() => server.close());

test("can get page content", async (t) => {
  const source = new BangumiMoeSource();
  const content = await source.getPage(1);
  t.is(content.length, 2);
  t.true(
    content.every(
      (i) => i.title && i.source_link && i.torrent_link && i.published_at,
    ),
  );
  t.is(
    content[0]?.title,
    "【喵萌奶茶屋】★04月新番★[外星筆記 / 星際莊的戀愛日記 / Astro Note][10][1080p][繁日雙語][招募翻譯]",
  );
  t.is(
    content[0]?.source_link,
    "https://bangumi.moe/torrent/666593fdbfe5da0007fb4e64",
  );
  t.is(
    content[0]?.torrent_link,
    "https://bangumi.moe/download/torrent/666593fdbfe5da0007fb4e64/666593fdbfe5da0007fb4e64.torrent",
  );
  t.deepEqual(content[0]?.published_at, new Date(1717933053303));
  t.deepEqual(
    content[0]?.info_hash,
    "e9de43a9729e986eebb7810df0425d4137067f62",
  );
});
