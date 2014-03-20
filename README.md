# Stolpersteine Server

[![Build Status](https://travis-ci.org/optionu/stolpersteine-server.png?branch=master)](https://travis-ci.org/optionu/stolpersteine-server) [![Dependency Status](https://www.versioneye.com/user/projects/526633b8632bac385d000003/badge.png)](https://www.versioneye.com/user/projects/526633b8632bac385d000003)

API server for [Stolperstein](http://en.wikipedia.org/wiki/Stolperstein) data.

## Stolpersteine API

### `GET /stolpersteine`

*Description*

Searches database for stolperstein data. Multiple search parameters are AND'ed together. Keyword searches are case insensitive and find items that start with the search term.

| Parameter     | Description                                           | Default |
| ------------- | ----------------------------------------------------- | ------- |
| offset        | starts returning stolpersteine at the given index     | 0       |
| limit         | limits the number of items returned in a query        | 10      |
| q             | searches all stolpersteine for one or more keywords   |         |
| street        | searches street names                                 |         |
| city          | searches city names, e.g. "Berlin"                    |         |
| state         | searches state names, e.g. "Brandenburg"              |         |

*Examples*

Retrieve the first 100 stolpersteine in the database:

    curl "<base URL>/stolpersteine?offset=0&limit=100"

Retrieve the next 100 stolpersteine:

    curl "<base URL>/stolpersteine?offset=100&limit=100"

Find all stolpersteine in streets starting with the word "calvin" (e.g. Calvinstraße):

    curl "<base URL>/stolpersteine?street=calvin&limit=0"

Find a maximum of 10 stolpersteine that include the terms "herta" and "mitte" (e.g. Herta Jalowitz in Berlin-Mitte):

    curl "<base URL>/stolpersteine?q=herta+mitte"

## Installation for development

Currently, the production system uses MongoDB 2.4.5 and Node.js 0.10.22.

### MongoDB

1. Download [MongoDB](https://www.mongodb.org/downloads)
2. Unpack and copy to any directory
3. Add the `bin` directory to `/etc/paths`
4. Start new terminal and run `mongod --dbpath ~/Downloads/`

MongoDB can be used with `mongo` client.

### Node.js

1. Download [Node.js](http://nodejs.org/download/) and install package
2. Install nodemon to restart Node.js when files have changed with `sudo npm install -g nodemon`
3. Start with `nodemon server.js`

API answers at [http://127.0.0.1:3000/v1/stolpersteine](http://127.0.0.1:3000/v1/stolpersteine)

### Unit tests

1. Install mocha with `sudo npm install -g mocha`
2. `npm test`

### Run import script

1. Modify `import/berlin_kss_stolpersteine.js` or any other import script to use localhost
2. Run `node import/berlin_kss_stolpersteine.js` to import data
3. Execute curl request printed in terminal to commit import to database

## Contact

[Claus Höfele](http://github.com/choefele)  
[@claushoefele](https://twitter.com/claushoefele)

## Licence (MIT)

Copyright (C) 2013 Option-U Software

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
