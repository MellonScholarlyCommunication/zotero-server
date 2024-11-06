#!/usr/bin/env node

const { zoteroLookup } = require('../lib/zotero');

const url = process.argv[2];

if (! url) {
    console.error(`${process.argv[1]} url`);
    process.exit(1);
}

main(url);

async function main(url) {
    try {
        const response = await zoteroLookup(url);
        console.log(response);
    }
    catch (e) {
        console.error(`error: ${e.message}`);
    }
}