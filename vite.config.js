import { resolve } from "node:path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const USERSCRIPT_HEADER = `// ==UserScript==
// @name         Kanji Koohii WaniKani Integration
// @namespace    https://github.com/juchym
// @version      1.0.0
// @description  Show the WaniKani mnemonics and custom stories in Kanji Koohii
// @match https://kanji.koohii.com/study/kanji
// @match https://kanji.koohii.com/study/kanji/
// @match https://kanji.koohii.com/study/kanji/*
// @match https://kanji.koohii.com/study/kanji?restudy
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      api.wanikani.com
// ==/UserScript==`;

export default defineConfig({
    plugins: [preact()],
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "src"),
        },
    },
    build: {
        lib: {
            entry: resolve(import.meta.dirname, "src/main.tsx"),
            name: "KanjiKoohiiWanikani",
            formats: ["iife"],
            fileName: () => "script.user.js",
        },
        rolldownOptions: {
            output: {
                strict: true,
                postBanner: USERSCRIPT_HEADER,
            },
        },
    },
});
