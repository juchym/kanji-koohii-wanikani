import * as z from "zod/mini";
import { useEffect, useState } from "preact/hooks";
import { UserStory } from "@/models/user-story";
import { UserStoryRepository } from "@/repositories/user-story";

type UserStoryPanelProps = {
    kanji: string;
    repository: UserStoryRepository;
};

type UserStoryPanelState =
    | { type: "loading-cache" }
    | { type: "no-cache" }
    | { type: "loading-story" }
    | { type: "found"; story: UserStory }
    | { type: "not-found" }
    | { type: "error"; error: unknown };

export default function UserStoryPanel({
    kanji,
    repository,
}: UserStoryPanelProps) {
    const [state, setState] = useState<UserStoryPanelState>({
        type: "loading-cache",
    });

    useEffect(() => {
        let mounted = true;

        async function loadCache() {
            const hasStories = await repository.hasStories();

            if (!mounted) {
                return;
            }

            setState(
                hasStories ? { type: "loading-story" } : { type: "no-cache" },
            );
        }

        loadCache();

        return () => {
            mounted = false;
        };
    }, [repository]);

    useEffect(() => {
        if (state.type !== "loading-story") {
            return;
        }

        let mounted = true;

        async function loadStory() {
            try {
                const story = await repository.getKanji(kanji);

                if (!mounted) {
                    return;
                }

                setState(
                    story ? { type: "found", story } : { type: "not-found" },
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }
                setState({ type: "error", error });
            }
        }

        loadStory();

        return () => {
            mounted = false;
        };
    }, [state, kanji, repository]);

    async function handleFileUpload(ev: Event) {
        const input = ev.currentTarget as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        try {
            const content = await file.text();
            const jsonl = parseJsonl(content);
            const stories = z.array(UserStory).parse(jsonl);
            await repository.setStories(stories);
            setState({ type: "loading-story" });
        } catch (error) {
            setState({ type: "error", error });
        }
    }

    async function clearCache() {
        if (
            confirm(
                "This will erase ALL your stories currently in cache. Continue?",
            )
        ) {
            await repository.clear();
            setState({ type: "no-cache" });
        }
    }

    switch (state.type) {
        case "loading-cache":
            return <div class="user-story">Loading stories...</div>;
        case "no-cache":
            return (
                <div class="user-story">
                    <label class="user-story__upload">
                        <span>Load your stories</span>
                        <input
                            type="file"
                            accept=".jsonl"
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
            );
        case "loading-story":
            return <div class="user-story">Loading story...</div>;
        case "found":
            return (
                <div class="user-story">
                    {
                        <div
                            class="user-story__story"
                            dangerouslySetInnerHTML={{
                                __html: replaceMarkdown(state.story.story),
                            }}
                        />
                    }
                    {state.story.asterisk && (
                        <div
                            class="user-story__asterisk-story"
                            dangerouslySetInnerHTML={{
                                __html: replaceMarkdown(state.story.asterisk),
                            }}
                        />
                    )}
                    <button onClick={clearCache}>Clear cache</button>
                </div>
            );
        case "not-found":
            return (
                <div class="user-story">No user story found for {kanji}.</div>
            );

        case "error":
            return (
                <div class="user-story">
                    Failed to load user story.
                    <button onClick={clearCache}>Clear cache</button>
                </div>
            );
    }
}

function replaceMarkdown(text: string) {
    return text
        .replace(/_(.*?)_/g, "<em>$1</em>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function parseJsonl(text: string): any[] {
    const result = [];

    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();

        if (!trimmed) {
            continue;
        }

        const row = JSON.parse(trimmed);

        result.push(row);
    }

    return result;
}
