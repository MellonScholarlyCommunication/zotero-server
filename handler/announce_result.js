const logger = require('ldn-inbox-server').getLogger();
const { generateId , generatePublished } = require('ldn-inbox-server');
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
        const service_error  = options['service_error'];

        let data;

        if (service_result) {
            data = {
                '@context': "https://www.w3.org/ns/activitystreams" ,
                id: generateId(),
                type: 'Announce',
                published: generatePublished(),
                actor: config['actor'],
                origin: config['origin'],
                context: notification['object']['id'],
                inReplyTo: notification['id'],
                object: {
                    id: options['service_result'],
                    type: "Document"
                },
                target: notification['actor']
            };
        }
        else {
            data = {
                '@context': "https://www.w3.org/ns/activitystreams" ,
                id: generateId(),
                type: 'Reject',
                published: generatePublished(),
                actor: config['actor'],
                origin: config['origin'],
                context: notification['object']['id'],
                inReplyTo: notification['id'],
                object: notification,
                target: notification['actor'],
                summary: service_error
            }; 
        }

        const dataText = JSON.stringify(data,null,4);

        const outboxFile = options['outbox'] + '/' + md5(dataText) + '.jsonld';

        ensureDirectoryExistence(outboxFile);

        logger.info(`storing ${data.type} to ${outboxFile}`);

        fs.writeFileSync(outboxFile,dataText);

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