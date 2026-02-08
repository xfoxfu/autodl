import * as date from "date-fns";
import ky from "ky";
import { type Item, Source, USER_AGENT } from "./index.js";

export class BangumiMoeSource extends Source {
	public override name = "BangumiMoe";
	public override link = "https://bangumi.moe";

	public override async getPage(page: number): Promise<Item[]> {
		const content = await ky
			.get(`https://bangumi.moe/api/torrent/page/${page}`, {
				headers: { "User-Agent": USER_AGENT },
			})
			.json<BangumiResponse>();
		return (
			content.torrents.map((item) => {
				return {
					title: item.title,
					published_at: date.parseISO(item.publish_time),
					source_link: `https://bangumi.moe/torrent/${item._id}`,
					torrent_link: `https://bangumi.moe/download/torrent/${item._id}/${item._id}.torrent`,
					info_hash: item.infoHash,
				} satisfies Item;
			}) ?? []
		);
	}
}

export interface BangumiResponse {
	torrents: BangumiTorrent[];
	count?: number;
	page_count: number;
}

export interface BangumiTorrent {
	_id: string;
	category_tag_id: string;
	title: string;
	introduction: string;
	tag_ids: string[];
	comments?: number;
	downloads: number;
	finished: number;
	leechers: number;
	seeders: number;
	uploader_id: string;
	team_id: string;
	publish_time: string;
	magnet: string;
	infoHash: string;
	file_id: string;
	teamsync?: boolean;
	content: string[][];
	size?: string;
	btskey?: string;
	sync?: Record<string, unknown>;
}
