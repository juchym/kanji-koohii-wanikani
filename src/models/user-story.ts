import * as z from "zod/mini";

export const UserStory = z.object({
    number: z.number(),
    kanji: z.string(),
    story: z.string(),
    asterisk: z.optional(z.string()),
});

export type UserStory = z.infer<typeof UserStory>;
