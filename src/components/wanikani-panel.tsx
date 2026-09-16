import { useEffect, useState } from "preact/hooks";
import { WKSubject, WKSubjectResource } from "@/models/wanikani";
import { classNames } from "@/utils";
import { WKRepository, WKSettings } from "@/repositories/wanikani";

type WaniKaniPanelProps = {
    kanji: string;
    repository: WKRepository;
    settings: WKSettings;
};

type WaniKaniPanelState =
    | { type: "loading-token" }
    | { type: "no-token" }
    | { type: "loading-subjects" }
    | { type: "found"; subjects: WKSubjectResource[] }
    | { type: "not-found" }
    | { type: "error"; error: unknown };

export default function WaniKaniPanel({
    kanji,
    repository,
    settings,
}: WaniKaniPanelProps) {
    const [state, setState] = useState<WaniKaniPanelState>({
        type: "loading-token",
    });

    useEffect(() => {
        let mounted = true;

        async function loadToken() {
            const token = await settings.getApiToken();

            if (!mounted) {
                return;
            }

            setState(
                token ? { type: "loading-subjects" } : { type: "no-token" },
            );
        }

        loadToken();

        return () => {
            mounted = false;
        };
    }, [settings]);

    useEffect(() => {
        if (state.type !== "loading-subjects") {
            return;
        }

        let mounted = true;

        async function loadSubjects() {
            try {
                const subjects = await repository.getKanji(kanji);

                if (!mounted) {
                    return;
                }

                setState(
                    subjects
                        ? { type: "found", subjects }
                        : { type: "not-found" },
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }
                setState({ type: "error", error });
            }
        }

        loadSubjects();

        return () => {
            mounted = false;
        };
    }, [state, kanji, repository]);

    async function handleTokenSubmit(token: string) {
        await settings.setApiToken(token);
        setState({ type: "loading-subjects" });
    }

    async function handleSubmit(ev: SubmitEvent) {
        ev.preventDefault();

        const form = ev.currentTarget as HTMLFormElement;
        const input = form.elements.namedItem("api-token") as HTMLInputElement;

        const token = input.value.trim();

        if (!token) {
            return;
        }

        handleTokenSubmit(token);
    }

    async function clearCache() {
        if (confirm("You will have to enter your API token again. Continue?")) {
            await repository.clear();
            await settings.clearApiToken();
            setState({ type: "no-token" });
        }
    }

    switch (state.type) {
        case "loading-token":
            return <div class="wanikani-panel">Loading token...</div>;

        case "no-token":
            return (
                <div class="wanikani-panel">
                    <div class="wanikani-panel__title">WaniKani</div>

                    <form onSubmit={handleSubmit}>
                        <label>
                            WaniKani API token
                            <input
                                type="text"
                                name="api-token"
                                autocomplete="off"
                                placeholder="Enter your API token"
                            />
                        </label>

                        <button type="submit">Save token</button>
                    </form>
                </div>
            );

        case "loading-subjects":
            return <div class="wanikani-panel">Loading subjects...</div>;

        case "found":
            const kanjiSubjects = state.subjects.filter(
                (s) => s.object === "kanji",
            );
            const radicalSubjects = state.subjects.filter(
                (s) => s.object === "radical",
            );
            return (
                <div class="wanikani-panel">
                    <div class="wanikani-panel__title">WaniKani Meaning</div>
                    {kanjiSubjects.map((s) => (
                        <WaniKaniPanelSection subject={s.data} kind="kanji" />
                    ))}
                    {radicalSubjects.map((s) => (
                        <WaniKaniPanelSection subject={s.data} kind="radical" />
                    ))}
                    <button onClick={clearCache}>Clear cache</button>
                </div>
            );
        case "not-found":
            return (
                <div class="wanikani-panel">
                    No WaniKani subject found for {kanji}.
                </div>
            );

        case "error":
            return (
                <div class="wanikani-panel">Failed to load WaniKani data.</div>
            );
    }
}

type WaniKaniPanelMeaningProps = {
    title: string;
    items: string;
    primary?: boolean;
};

function WaniKaniPanelMeaning({
    title,
    items,
    primary = false,
}: WaniKaniPanelMeaningProps) {
    return (
        <div
            class={classNames(
                "wanikani-panel__meaning",
                primary && "wanikani-panel__meaning--primary",
            )}
        >
            <div class="wanikani-panel__meaning-title">{title}</div>
            <div class="wanikani-panel__meaning-items">{items}</div>
        </div>
    );
}

type WaniKaniPanelSectionProps = {
    subject: WKSubject;
    kind: "kanji" | "radical";
};

function WaniKaniPanelSection({ subject, kind }: WaniKaniPanelSectionProps) {
    const primaryMeaning = subject.meanings.find((m) => m.primary)?.meaning;
    const alternativeMeanings = subject.meanings
        .filter((m) => !m.primary)
        .map((m) => m.meaning);

    return (
        <div
            class={classNames(
                "wanikani-panel__section",
                kind === "kanji" && "wanikani-panel__section--kanji",
                kind === "radical" && "wanikani-panel__section--radical",
            )}
        >
            <div class="wanikani-panel__meanings">
                {primaryMeaning && (
                    <WaniKaniPanelMeaning
                        title="Primary"
                        items={primaryMeaning}
                        primary
                    />
                )}
                {alternativeMeanings.length > 0 && (
                    <WaniKaniPanelMeaning
                        title="Alternatives"
                        items={alternativeMeanings.join(", ")}
                    />
                )}
            </div>
            <div
                class="wanikani-panel__mnemonic"
                dangerouslySetInnerHTML={{
                    __html: replaceWkMarkup(subject.meaning_mnemonic),
                }}
            ></div>
        </div>
    );
}

function replaceWkMarkup(text: string) {
    return text
        .replace(
            /<radical>(.*?)<\/radical>/g,
            '<span class="wanikani-panel__highlight wanikani-panel__highlight--radical">$1</span>',
        )
        .replace(
            /<reading>(.*?)<\/reading>/g,
            '<span class="wanikani-panel__highlight wanikani-panel__highlight--reading">$1</span>',
        )
        .replace(
            /<kanji>(.*?)<\/kanji>/g,
            '<span class="wanikani-panel__highlight wanikani-panel__highlight--kanji">$1</span>',
        );
}
