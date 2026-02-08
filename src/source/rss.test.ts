import fs from "node:fs/promises";
import test from "ava";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
	AcgnxRssSource,
	AcgRipRssSource,
	DmhyRssSource,
	NyaaRssSource,
} from "./rss.js";

const server = setupServer(
	http.get("https://acg.rip/page/1.xml", async () => {
		return HttpResponse.text(
			(await fs.readFile("assets/test/acgrip.rss.xml")).toString(),
		);
	}),
	http.get("https://share.dmhy.org/topics/rss/rss.xml", async () => {
		return HttpResponse.text(
			(await fs.readFile("assets/test/dmhy.rss.xml")).toString(),
		);
	}),
	http.get("https://nyaa.si/", async () => {
		return HttpResponse.text(
			(await fs.readFile("assets/test/nyaa.rss.xml")).toString(),
		);
	}),
	http.get("https://www.acgnx.se/rss.xml", async () => {
		return HttpResponse.text(
			(await fs.readFile("assets/test/acgnx.rss.xml")).toString(),
		);
	}),
);

test.before(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.after(() => server.close());

test("can parse rss field (ACG.RIP)", async (t) => {
	const source = new AcgRipRssSource();
	const content = await source.getPage(1);
	t.is(content.length, 3);
	t.true(
		content.every(
			(i) =>
				i.title &&
				i.source_link &&
				i.torrent_link &&
				i.published_at &&
				i.source_link.startsWith("https://acg.rip/t/") &&
				i.torrent_link.match(/https:\/\/acg.rip\/t\/\d+.torrent/),
		),
	);
	t.is(
		content[0]?.title,
		"[YYSUB-RAW]Chibi Maruko-chan II 樱桃小丸子[1434][2024.06.09][AVC][1080P][FOD]",
	);
	t.is(content[0]?.source_link, "https://acg.rip/t/305824");
	t.is(content[0]?.torrent_link, "https://acg.rip/t/305824.torrent");
	t.deepEqual(content[0]?.published_at, new Date(1717930318000));
	t.is(content[0]?.info_hash, undefined);
});

test("can parse rss field (dmhy)", async (t) => {
	const source = new DmhyRssSource();
	const content = await source.getPage(1);
	t.is(content.length, 3);
	t.true(
		content.every(
			(i) =>
				i.title &&
				i.source_link &&
				i.torrent_link &&
				i.published_at &&
				i.source_link.startsWith("http://share.dmhy.org/topics/view/"),
		),
	);
	t.is(
		content[0]?.title,
		"[YYSUB-RAW]Chibi Maruko-chan II 樱桃小丸子[1434][2024.06.09][AVC][1080P][FOD]",
	);
	t.is(
		content[0]?.source_link,
		"http://share.dmhy.org/topics/view/671696_YYSUB-RAW_Chibi_Maruko-chan_II_1434_2024_06_09_AVC_1080P_FOD.html",
	);
	t.is(
		content[0]?.torrent_link,
		"https://dl.dmhy.org/2024/06/09/b8de2f71ae5acefa1d6ad16edf8b9419a22871fe.torrent",
	);
	t.deepEqual(content[0]?.published_at, new Date(1717930319000));
	t.is(content[0]?.info_hash, "b8de2f71ae5acefa1d6ad16edf8b9419a22871fe");

	t.is(
		content[1]?.torrent_link,
		"https://dl.dmhy.org/2024/06/09/264a978050e9c1ca71e4bef790ceb744b971fa15.torrent",
	);
	t.is(
		content[2]?.torrent_link,
		"https://dl.dmhy.org/2024/06/08/c1bfad08a99ac2ea25476dbd183ea51742b7f53c.torrent",
	);
	t.is(source.supportPagination, false);
});

test("can parse rss field (acgnx)", async (t) => {
	const source = new AcgnxRssSource();
	const content = await source.getPage(1);
	t.is(content.length, 2);
	t.true(
		content.every(
			(i) =>
				i.title &&
				i.source_link &&
				i.torrent_link &&
				i.published_at &&
				i.source_link.startsWith("https://www.acgnx.se/show-"),
		),
	);
	t.is(
		content[0]?.title,
		"[shincaps] Yozakura-san Chi no Daisakusen - 10 (AT-X 1440x1080 MPEG2 TS).ts",
	);
	t.is(
		content[0]?.source_link,
		"https://www.acgnx.se/show-866ed1f2b35409efe9cdca9e0a1ce25a81586599.html",
	);
	t.is(
		content[0]?.torrent_link,
		"https://www.acgnx.se/down.php?date=1718112647&hash=866ed1f2b35409efe9cdca9e0a1ce25a81586599",
	);
	t.deepEqual(
		content[0]?.published_at,
		new Date("Tue, 11 Jun 2024 13:30:47 +0000"),
	);
	t.is(content[0]?.info_hash, "866ed1f2b35409efe9cdca9e0a1ce25a81586599");

	t.is(
		content[1]?.torrent_link,
		"https://www.acgnx.se/down.php?date=1718111335&hash=994fdc08017936fa05d611d929744a4b81dab5c0",
	);
	t.is(source.supportPagination, false);
});

test("can parse rss field (Nyaa)", async (t) => {
	const source = new NyaaRssSource();
	const content = await source.getPage(1);
	t.is(content.length, 2);
	t.true(
		content.every(
			(i) =>
				i.title &&
				i.source_link &&
				i.torrent_link &&
				i.published_at &&
				i.source_link.startsWith("https://nyaa.si/view/"),
		),
	);
	t.is(
		content[0]?.title,
		"[shincaps] Yozakura-san Chi no Daisakusen - 10 (AT-X 1440x1080 MPEG2 TS).ts",
	);
	t.is(content[0]?.source_link, "https://nyaa.si/view/1832232");
	t.is(content[0]?.torrent_link, "https://nyaa.si/download/1832232.torrent");
	t.deepEqual(
		content[0]?.published_at,
		new Date("Tue, 11 Jun 2024 13:30:47 -0000"),
	);
	t.is(content[0]?.info_hash, "866ed1f2b35409efe9cdca9e0a1ce25a81586599");

	t.is(content[1]?.source_link, "https://nyaa.si/view/1832231");
	t.is(content[1]?.torrent_link, "https://nyaa.si/download/1832231.torrent");
	t.is(source.supportPagination, false);
});
