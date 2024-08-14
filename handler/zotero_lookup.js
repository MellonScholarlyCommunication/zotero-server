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

        fs.writeFileSync(filePath,reference);

        const zotero_content_type = process.env.ZOTERO_CONTENT_TYPE || 'application/json';

        fs.writeFileSync(`${filePath}.meta`, JSON.stringify({
            'Content-Type': zotero_content_type
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
    try {
        const zotero_service = process.env.ZOTERO_SERVICE;
        const zotero_format  = process.env.ZOTERO_FORMAT;

        if (! zotero_service) {
            throw new Error('No ZOTERO_SERVICE environment defined');
        }

        logger.info(`posting ${url} to ${zotero_service}/web`);
        const response = await backOff_fetch(`${zotero_service}/web`, { 
            method: 'POST' ,
            body: url,
            headers: {
                "Content-Type" : "text/plain"
            }
        });

        let data;

        if (response.ok) {
            data = await response.text();
        }
        else {
            logger.error(`Zotero returned ${response.status} - ${response.statusText}`);
            return null;
        }

        if (! data) {
            return null;
        }

        if (! zotero_format || zotero_format == 'zotero') {
            return data;
        }

        logger.info(`posting zotero response to ${zotero_service}/export?format=${zotero_format}`);
        logger.debug(data);

        const response2 = await backOff_fetch(`${zotero_service}/export?format=${zotero_format}`, { 
            method: 'POST' ,
            body: data , 
            headers: {
                "Content-Type" : "application/json"
            }
        });

        if (response2.ok) {
            return await response2.text();
        }
        else {
            logger.error(`zotero returned ${response.status} - ${response.statusText}`);
            return null;
        }
    }
    catch (e) {
        logger.error(`zotero lookup failed`);
        logger.debug(e);
        return null;
    }
}

module.exports = { handle };