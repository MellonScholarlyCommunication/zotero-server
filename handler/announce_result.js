const logger = require('ldn-inbox-server').getLogger();
const { parseAsJSON } = require('ldn-inbox-server');
const fsPath = require('path');
const fs = require('fs');
const md5 = require('md5');

async function handle({path,options,config}) {
    logger.info(`parsing notification ${path}`);

    if (! config) {
        logger.error('no configuration found');
        return { path, options, success: false };
    }
   
    if (! config['actor']) {
        logger.error('no actor entry'); 
        return { path, options, success: false };
    }

    try {
        const notification = parseAsJSON(path);

        const data = JSON.stringify({
            '@context': "https://www.w3.org/ns/activitystreams" ,
            type: 'Announce',
            actor: config['actor'],
            object: {
                id: options['service_result'],
                type: "Document"
            },
            target: notification['actor']
        },null,4);

        const outboxFile = options['outbox'] + '/' + md5(data) + '.jsonld';

        ensureDirectoryExistence(outboxFile);

        logger.info(`storing Offer to ${outboxFile}`);

        fs.writeFileSync(outboxFile,data);

        return { path, options, success: true };
    }
    catch(e) {
        logger.error(`failed to process ${path}`);
        logger.error(e);
        return { path, options, success: false };
    }
}

function ensureDirectoryExistence(filePath) {
    var dirname = fsPath.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

module.exports = { handle };