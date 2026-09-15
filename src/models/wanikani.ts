import * as z from "zod/mini";

const WKMeaning = z.object({
    meaning: z.string(),
    primary: z.boolean(),
});

type WKMeaning = z.infer<typeof WKMeaning>;

const WKKanjiSubject = z.object({
    characters: z.string(),
    component_subject_ids: z.array(z.number()),
    meaning_mnemonic: z.string(),
    meaning_hint: z.nullable(z.optional(z.string())),
    meanings: z.array(WKMeaning),
});

type WKKanjiSubject = z.infer<typeof WKKanjiSubject>;

const WKRadicalSubject = z.object({
    characters: z.nullable(z.string()),
    meaning_mnemonic: z.string(),
    meaning_hint: z.optional(z.string()),
    meanings: z.array(WKMeaning),
});

type WKRadicalSubject = z.infer<typeof WKRadicalSubject>;

const WKSubject = z.union([WKKanjiSubject, WKRadicalSubject]);

export type WKSubject = z.infer<typeof WKSubject>;

const WKKanjiResource = z.object({
    object: z.literal("kanji"),
    data: WKKanjiSubject,
});

const WKRadicalResource = z.object({
    object: z.literal("radical"),
    data: WKRadicalSubject,
});

export const WKSubjectResource = z.discriminatedUnion("object", [
    WKKanjiResource,
    WKRadicalResource,
]);

export type WKSubjectResource = z.infer<typeof WKSubjectResource>;

export const WKCollection = z.object({
    object: z.literal("collection"),
    pages: z.object({
        next_url: z.nullable(z.string()),
    }),
    data: z.array(WKSubjectResource),
});

const WKResponse = z.discriminatedUnion("object", [
    WKCollection,
    WKKanjiResource,
    WKRadicalResource,
]);


export type WKSubjectType = "kanji" | "radical"; // there is more
