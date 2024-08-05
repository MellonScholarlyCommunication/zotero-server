const logger = require('ldn-inbox-server').getLogger();
const { parseAsJSON , backOff_fetch } = require('ldn-inbox-server');
const fsPath = require('path');
const fs = require('fs');
const md5 = require('md5');

/**
 * Handler to lookup an artifact url against Zotero and store the
 * result as a service result file 
 */
async function handle({path,options,config}) {
    logger.info(`parsing notification ${path}`);

    try {
        const notification = parseAsJSON(path);
     
        const artifact_id = notification['object']['id'];

        const reference = await zoteroLookup(artifact_id);

        const date = getDate();

        const filePath = fsPath.resolve(options['public'],'result',date,`${md5(artifact_id)}.json`);

        ensureDirectoryExistence(filePath);

        fs.writeFileSync(filePath,JSON.stringify(reference,null,2));

        fs.writeFileSync(`${filePath}.meta`, JSON.stringify({
            'Content-Type': 'application/json'
        },null,2), { });

        logger.info(`generated ${filePath}`);

        options['service_result'] = `${options['base']}/result/${date}/${md5(artifact_id)}.json`;
        
        logger.info(`service result: ${options['service_result']}`);

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

function getDate() {
    const dateObj = new Date();
    const year  = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1;
    const day   = dateObj.getUTCDate();

    const pMonth        = month.toString().padStart(2,"0");
    const pDay          = day.toString().padStart(2,"0");
    const newPaddedDate = `${year}/${pMonth}/${pDay}`;

    return newPaddedDate;
}

async function zoteroLookup(url) {
    const zotero_service = process.env.ZOTERO_SERVICE;

    if (! zotero_service) {
        throw new Error('No ZOTERO_SERVICE environment defined');
    }

    const response = await backOff_fetch(zotero_service, { 
        method: 'POST' ,
        body: url,
        headers: {
            "Content-Type" : "text/plain"
        }
    });

    if (response.ok) {
        return await response.json();
    }
    else {
        logger.error(`Zotero returned ${response.status} - ${response.statusText}`);
        return null;
    }
}

module.exports = { handle };