# cli-notes

A simple command-line note-taking app. Create, search, and delete notes from your terminal — or browse them in a local web viewer.

Notes are stored locally in a plain JSON file (`db.json`), so there's no database to set up and no data leaves your machine.

## Features

- 📝 Create notes from the command line
- 🏷️ Tag notes for easy organization
- 🔍 Search notes by content or tag
- 🗑️ Remove single notes or wipe everything at once
- 🌐 View all notes in your browser with a built-in web server
- 🎨 Responsive viewer with automatic light/dark themes

## Requirements

- [Node.js](https://nodejs.org/) v20.19+ (or v22.12+ / v23+)

## Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd cli-notes
npm install
```

Then link the CLI globally so you can run it as `note` from anywhere:

```bash
npm link
```

Alternatively, run commands directly with `node index.js <command>` without linking.

## Usage

```
note <command> [options]
```

### Commands

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `note new <note>`     | Create a new note                            |
| `note all`            | List all notes                               |
| `note find <filter>`  | Find notes whose content or tags match the filter |
| `note remove <id>`    | Remove a note by its id                      |
| `note web [port]`     | Launch a web viewer for your notes           |
| `note clean`          | Remove all notes                             |

### Options

| Option             | Alias | Description              |
| ------------------ | ----- | ------------------------ |
| `--tags <tags>`    | `-t`  | Comma-separated tags     |

### Examples

Create a note:

```bash
note new "Buy groceries" --tags shopping,personal
```

List all notes:

```bash
note all
```

Search notes by content or tag:

```bash
note find groceries
note find shopping   # matches notes tagged "shopping"
```

Remove a note by its id:

```bash
note remove 1792085549095
```

Open the web viewer (defaults to port 5000):

```bash
note web 3000
```

Delete all notes:

```bash
note clean
```

## How notes are stored

Notes live in `db.json` at the root of the project. It is created automatically on first use and git-ignored, so your notes stay local and out of version control:

```json
{
  "notes": [
    {
      "id": 1792085549095,
      "content": "Buy groceries",
      "tags": ["shopping", "personal"]
    }
  ]
}
```

Each note gets a unique id based on its creation timestamp. You can back up or edit this file directly.

## Project structure

```
cli-notes/
├── index.js            # CLI entry point (bin: note)
├── db.json             # JSON note storage
└── src/
    ├── command.js      # yargs command definitions
    ├── notes.js        # note operations (create, find, remove)
    ├── db.js           # read/write helpers for db.json
    ├── server.js       # web viewer server
    ├── utils.js        # console output formatting
    └── template.html   # HTML template for the web viewer
```

## License

ISC
