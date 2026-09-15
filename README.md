# Kanji Koohii WaniKani Integration

A Tampermonkey userscript that adds two new panels to [Kanji Koohii](https://kanji.koohii.com) kanji pages:

- **User Story** — load your own stories from a JSONL file and display them alongside your Kanji Koohii stories, with no character limit.
- **WaniKani Meaning** — view the WaniKani meaning mnemonic for the current kanji directly on Kanji Koohii.

## Features

### WaniKani Mnemonics

Adds a panel with the WaniKani meaning mnemonic for the current kanji.

This lets you compare WaniKani mnemonics with RTK or community-created stories and pick what works best for you.

### User Stories

Adds a second panel for your own kanji stories.

Stories are loaded from a JSONL (JSON Lines) file, with one JSON object per line.

Each story entry must contain:

```json
{
    "kanji": "日",
    "story": "<p>It's a kanji for <b>day</b>.</p>",
    "asterisk": "<p>As a primitive it can mean <i>sun</i>.</p>"
}
```

The supported fields are:

| Field      | Required | Description                    |
| ---------- | -------- | ------------------------------ |
| `kanji`    | Yes      | The kanji the story belongs to |
| `story`    | Yes      | Your mnemonic/story            |
| `asterisk` | No       | Any additional information     |

Each entry must be on its own line, and each line must contain valid JSON. The `asterisk` field can be omitted if you don't need it.

## Contributing

Issues, improvements, and pull requests are welcome.
