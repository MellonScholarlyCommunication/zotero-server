const logger = require('ldn-inbox-server').getLogger();
const { backOff_fetch } = require('ldn-inbox-server');

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

module.exports = { zoteroLookup };