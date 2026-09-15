import * as z from "zod/mini";
import { UserStory } from "@/models/user-story";
import { getJson, getString, remove, setJson } from "@/persistence";

const CachedUserStories = z.record(z.string(), UserStory);

type CachedUserStories = z.infer<typeof CachedUserStories>;

// The same as WKCacheResult, maybe I need to make cache a more general class
type UserStoryCacheResult<T> =
    { type: "hit"; value: T } | { type: "miss" } | { type: "empty" };

export class UserStoryCache {
    private static readonly CACHE_KEY = "external_kanji_mnemonic_cache";

    async setStories(stories: UserStory[]) {
        const cache: CachedUserStories = {};
        for (const story of stories) {
            cache[story.kanji] = story;
        }

        await setJson(UserStoryCache.CACHE_KEY, cache);
    }

    async hasStories(): Promise<boolean> {
        const stories = getJson(UserStoryCache.CACHE_KEY);
        return stories !== null;
    }

    async getKanji(kanji: string): Promise<UserStoryCacheResult<UserStory>> {
        const cache = await getJson(UserStoryCache.CACHE_KEY);

        if (!cache) {
            return { type: "empty" };
        }

        const stories = CachedUserStories.parse(cache)[kanji];

        return stories ? { type: "hit", value: stories } : { type: "miss" };
    }

    async clear() {
        remove(UserStoryCache.CACHE_KEY);
    }
}

export class UserStoryRepository {
    constructor(private cache: UserStoryCache) {}

    async hasStories(): Promise<boolean> {
        return this.cache.hasStories();
    }

    async setStories(stories: UserStory[]) {
        return this.cache.setStories(stories);
    }

    async getKanji(kanji: string): Promise<UserStory | null> {
        let result = await this.cache.getKanji(kanji);

        switch (result.type) {
            case "hit":
                console.log("Using cached user story");
                return result.value;

            case "empty":
            case "miss":
                return null;
        }
    }

    async clear() {
        await this.cache.clear();
    }
}
