export abstract class Source {
	public abstract name: string;
	public abstract link: string;
	public abstract getPage(page: number): Promise<Item[]>;
	public supportPagination = true;
}

export interface Item {
	title: string;
	published_at: Date;
	source_link: string;
	torrent_link: string;
	info_hash?: string | undefined;
}

export const USER_AGENT =
	"xfoxfu/ZhuiAni.me (https://github.com/xfoxfu/ZhuiAni.me)";
