# Ark

[![CircleCI](https://circleci.com/gh/makeark/ark/tree/master.svg?style=svg)](https://circleci.com/gh/makeark/ark/tree/master)

A workspace for developers who use MongoDB.

## Features

- A script editor with full mongosh support and intellisense.
- Tree and plain text views of script results.
- Inline document editing support of results in tree view.

## Development

Install dependencies using `npm i`.

### Running in VSCode

1. To build the main process (electron), run `npm run dev:electron`.
2. Run the VSCode launch configuration named "Electron: All".

### Running on a terminal

1. To build the main process (electron), run `npm run dev:electron`.
2. Run `npm run start` in another terminal.

## Building a distributable

**Note: You require node v14+ to build using electron-builder**

- Run `npm run build`.
- The npm scripts `dist:linux`, `dist:windows` and `dist:macos` are available for creating a distributable for respective platforms.
