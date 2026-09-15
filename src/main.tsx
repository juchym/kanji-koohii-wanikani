import { render } from "preact";

import WaniKaniPanel from "@/components/wanikani-panel";
import UserStoryPanel from "@/components/user-story-panel";
import css from "@/style.css?inline";
import {
    WKApi,
    WKCache,
    WKRepository,
    WKSettings,
} from "./repositories/wanikani";
import { UserStoryCache, UserStoryRepository } from "./repositories/user-story";

function findKanji() {
    return document.querySelector(".kanji")?.textContent;
}

function addStyle() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
}

async function main() {
    addStyle();
    const kanji = findKanji();

    if (!kanji) {
        console.log("Could not find kanji");
        return;
    }

    console.log("Detected kanji:", kanji);

    const wkSettings = new WKSettings();
    const wkRepository = new WKRepository(new WKApi(wkSettings), new WKCache());

    const userStoryRepository = new UserStoryRepository(new UserStoryCache());

    const wkMount = document.createElement("div");
    wkMount.dataset.wkRoot = "";
    document.getElementById("EditStoryComponent")?.after(wkMount);
    render(
        <WaniKaniPanel
            kanji={kanji}
            repository={wkRepository}
            settings={wkSettings}
        />,
        wkMount,
    );

    const userStoryMount = document.createElement("div");
    userStoryMount.dataset.userStoryRoot = "";
    document.getElementById("EditStoryComponent")?.after(userStoryMount);
    render(
        <UserStoryPanel kanji={kanji} repository={userStoryRepository} />,
        userStoryMount,
    );
}

try {
    main();
} catch (error) {
    console.error("Userscript failed:", error);
}
