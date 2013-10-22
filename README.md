# Stolpersteine Server

[![Build Status](https://travis-ci.org/optionu/stolpersteine-server.png?branch=master)](https://travis-ci.org/optionu/stolpersteine-server) [![Dependency Status](https://www.versioneye.com/user/projects/526633b8632bac385d000003/badge.png)](https://www.versioneye.com/user/projects/526633b8632bac385d000003)

API server for [Stolperstein](http://en.wikipedia.org/wiki/Stolperstein) data.

## Stolpersteine API

### `GET /stolpersteine`

*Description*

Searches database for stolperstein data. Multiple search parameters are AND'ed together. Keyword searches are case insensitive and find items that start with the search term.

| Parameter     | Description                                         | Default |
| ------------- | --------------------------------------------------- | ------- |
| offset        | starts returning stolpersteine at the given index   | 0       |
| limit         | limits the number of items returned in a query      | 10      |
| q             | searches all stolpersteine for one or more keywords |         |
| street        | searches street names                               |         |
| city          | searches city names                                 |         |

*Examples*

Retrieve the first 100 stolpersteine in the database:

    curl "<base URL>/stolpersteine?offset=0&limit=100"

Retrieve the next 100 stolpersteine:

    curl "<base URL>/stolpersteine?offset=100&limit=100"

Find all stolpersteine in streets starting with the word "calvin" (e.g. Calvinstraße):

    curl "<base URL>/stolpersteine?street=calvin&limit=0"

Find a maximum of 10 stolpersteine that include the terms "herta" and "mitte" (e.g. Herta Jalowitz in Berlin-Mitte):

    curl "<base URL>/stolpersteine?q=herta+mitte"

## Contact

[Claus Höfele](http://github.com/choefele)  
[@claushoefele](https://twitter.com/claushoefele)

## Licence

Copyright (C) 2013 Option-U Software

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
