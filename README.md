# ark

A MongoDB client.

## Setup

* Install dependencies using `npm i`.
* Create a folder `bin` in root of the repository.
* Download the `mongosh` binary from [here](https://www.mongodb.com/try/download/shell) for your platform. Use the tarball/zip downloads and get the binary.

## Building a distributable

**Note: You require node v14+ to build using electron-builder**

* Run `npm run build`.
* The npm scripts `dist:linux`, `dist:windows` and `dist:macos` are available for creating a distributable for respective platforms.

## Developing the react app only
* Run the application using `npm start`.
