import * as z from "zod/mini";
import {
    WKCollection,
    WKSubjectResource,
    type WKSubjectType,
} from "@/models/wanikani";
import { getJson, getString, remove, setJson, setString } from "@/persistence";

const WKCachedSubjects = z.record(z.string(), z.array(WKSubjectResource));

type WKCachedSubjects = z.infer<typeof WKCachedSubjects>;

export class WKApi {
    private static readonly API_BASE_URL =
        "https://api.wanikani.com/v2/subjects";

    constructor(private settings: WKSettings) {}

    async subjects(types: WKSubjectType[]): Promise<WKSubjectResource[]> {
        const token = await this.settings.getApiToken();
        const result: WKSubjectResource[] = [];

        let url: URL | string | null = new URL(WKApi.API_BASE_URL);
        url.searchParams.set("types", types.join(","));

        while (url) {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(
                    `WaniKani API: ${response.status} ${response.statusText}`,
                );
            }

            const json = await response.json();
            const collection = WKCollection.parse(json);

            result.push(...collection.data);

            url = collection.pages.next_url;
        }
        return result;
    }
}

type WKCacheResult<T> =
    { type: "hit"; value: T } | { type: "miss" } | { type: "empty" };

export class WKCache {
    private static readonly CACHE_KEY = "wanikani_kanji_cache";

    async setSubjects(subjects: WKSubjectResource[]) {
        const cache: WKCachedSubjects = {};
        for (const subject of subjects) {
            if (subject.data.characters === null) {
                continue;
            }
            cache[subject.data.characters] ??= [];
            cache[subject.data.characters].push(subject);
        }

        await setJson(WKCache.CACHE_KEY, cache);
    }

    async getKanji(kanji: string): Promise<WKCacheResult<WKSubjectResource[]>> {
        const cache = await getJson(WKCache.CACHE_KEY);

        if (!cache) {
            return { type: "empty" };
        }

        const subjects = WKCachedSubjects.parse(cache)[kanji];

        return subjects ? { type: "hit", value: subjects } : { type: "miss" };
    }

    async clear() {
        remove(WKCache.CACHE_KEY);
    }
}

export class WKRepository {
    constructor(
        private api: WKApi,
        private cache: WKCache,
    ) {}

    async getKanji(kanji: string): Promise<WKSubjectResource[] | null> {
        let result = await this.cache.getKanji(kanji);

        switch (result.type) {
            case "hit":
                console.log("Using cached WaniKani subjects");
                return result.value;

            case "empty":
                console.log("Downloading WaniKani subjects...");
                const subjects = await this.api.subjects(["kanji", "radical"]);

                await this.cache.setSubjects(subjects);

                return subjects.filter((s) => s.data.characters === kanji);

            case "miss":
                return null;
        }
    }

    async clear() {
        await this.cache.clear();
    }
}

export class WKSettings {
    private static readonly CACHE_KEY = "WK_API_TOKEN";

    async getApiToken(): Promise<string | null> {
        return await getString(WKSettings.CACHE_KEY);
    }

    async setApiToken(token: string) {
        await setString(WKSettings.CACHE_KEY, token);
    }

    async clearApiToken() {
        await remove(WKSettings.CACHE_KEY);
    }
}
