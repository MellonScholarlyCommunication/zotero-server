const logger = require('ldn-inbox-server').getLogger();
const { parseAsJSON , generateId , generatePublished } = require('ldn-inbox-server');
const fsPath = require('path');
const fs = require('fs');
const md5 = require('md5');

async function handle({path,options,config,notification}) {
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
        const service_result = options['service_result'];

        let data;

        if (service_result) {
            data = JSON.stringify({
                '@context': "https://www.w3.org/ns/activitystreams" ,
                id: generateId(),
                type: 'Announce',
                published: generatePublished(),
                actor: config['actor'],
                origin: config['origin'],
                inReplyTo: notification['id'],
                object: {
                    id: options['service_result'],
                    type: "Document"
                },
                target: notification['actor']
            },null,4);
        }
        else {
            data = JSON.stringify({
                '@context': "https://www.w3.org/ns/activitystreams" ,
                id: generateId(),
                type: 'Reject',
                published: generatePublished(),
                actor: config['actor'],
                origin: config['origin'],
                inReplyTo: notification['id'],
                object: notification,
                target: notification['actor']
            },null,4); 
        }

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