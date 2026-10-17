import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
    newNote,
    getAllNotes,
    findNotes,
    removeNote,
    removeAllNotes,
} from './notes.js';

import { listNotes } from './utils.js';
import { start } from './server.js';

const cli = yargs(hideBin(process.argv))
    .scriptName('note')
    .usage('Usage: $0 <command> [options]')
    .strict()
    .fail((msg, error) => {
        console.error(`\n  Error: ${error?.message ?? msg}\n`);
        console.error(
            '  Run "note --help" to see usage and available commands.\n',
        );
        process.exit(1);
    })
    .option('tags', {
        alias: 't',
        type: 'string',
        description: 'comma-separated tags to add to the note',
    })
    .command(
        'new <note..>',
        'create a new note',
        (yargs) => {
            return yargs.positional('note', {
                describe: 'the content of the note you want to create',
                type: 'string',
            });
        },
        async (argv) => {
            const parts = Array.isArray(argv.note) ? argv.note : [argv.note];
            const content = parts.filter(Boolean).join(' ').trim();

            if (!content) {
                throw new Error(
                    'a note needs some content, e.g. note new "Buy groceries"',
                );
            }

            const tags = (argv.tags || '')
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

            const note = await newNote(content, tags);
            const tagInfo =
                tags.length > 0 ? ` (tags: ${tags.join(', ')})` : '';
            console.log(`Created note with id: ${note.id}${tagInfo}`);
        },
    )
    .command(
        'all',
        'get all notes',
        () => {},
        async () => {
            const notes = await getAllNotes();

            if (notes.length === 0) {
                console.log('You have no notes yet.');
                console.log(
                    'Create your first one with:  note new "My first note"',
                );
                return;
            }

            listNotes(notes);
        },
    )
    .command(
        'find <filter>',
        'get matching notes',
        (yargs) => {
            return yargs.positional('filter', {
                describe:
                    'the search term to filter notes by, applied to note content and tags',
                type: 'string',
            });
        },
        async (argv) => {
            const notes = await findNotes(argv.filter);

            if (notes.length === 0) {
                console.log(`No notes found matching "${argv.filter}".`);
                console.log('Run "note all" to see all of your notes.');
                return;
            }

            listNotes(notes);
        },
    )
    .command(
        'remove <id>',
        'remove a note by id',
        (yargs) => {
            return yargs.positional('id', {
                type: 'string',
                describe: 'the id of the note you want to remove',
            });
        },
        async (argv) => {
            const id = Number(argv.id);

            if (!Number.isInteger(id)) {
                throw new Error(
                    `"${argv.id}" is not a valid note id, run "note all" to see note ids`,
                );
            }

            const removed = await removeNote(id);

            if (!removed) {
                console.warn(`No note found with id ${id}.`);
                console.log('Run "note all" to see all notes and their ids.');
                process.exitCode = 1;
                return;
            }

            console.log(`Removed note with id: ${id}`);
        },
    )
    .command(
        'web [port]',
        'launch website to see notes',
        (yargs) => {
            return yargs.positional('port', {
                describe: 'the port to bind the web viewer to',
                default: '5000',
                type: 'string',
            });
        },
        async (argv) => {
            const port = Number(argv.port);
            const isValidPort =
                Number.isInteger(port) && port >= 1 && port <= 65535;

            if (!isValidPort) {
                throw new Error(
                    `"${argv.port}" is not a valid port, use a number between 1 and 65535`,
                );
            }

            const notes = await getAllNotes();

            if (notes.length === 0) {
                console.warn(
                    'You have no notes yet, so the page will be empty.',
                );
                console.log('Create one with:  note new "My first note"');
            }

            start(notes, port);
        },
    )
    .command(
        'clean',
        'remove all notes',
        () => {},
        async () => {
            const removedCount = await removeAllNotes();

            if (removedCount === 0) {
                console.log('No notes to remove.');
                return;
            }

            console.log(`Removed all notes (${removedCount}).`);
        },
    )
    .demandCommand(1, 'Please specify a command.')
    .example('note new "Buy groceries" --tags shopping', 'Create a note with tags')
    .example('note find groceries', 'Search notes by content or tag')
    .example('note web 3000', 'Browse your notes in a web page')
    .epilogue('Run "note <command> --help" for details about a command.')
    .parseAsync();

cli.catch((error) => {
    console.error(`\n  Error: ${error.message}\n`);
    console.error('  Run "note --help" to see usage and available commands.\n');
    process.exitCode = 1;
});
