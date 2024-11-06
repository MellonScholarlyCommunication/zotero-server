const logger = require('ldn-inbox-server').getLogger();
const { backOff_fetch } = require('ldn-inbox-server');

async function zoteroLookup(url) {
    return new Promise( async (resolve,reject) => {
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
                const error = await response.text();
                return reject(new Error(`ELOOKUP - ${error}`));
            }

            if (! data) {
                return reject(new Error('EMPTY - no data returned'));
            }

            if (! zotero_format || zotero_format == 'zotero') {
                return resolve(data);
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
                return resolve(await response2.text());
            }
            else {
                logger.error(`zotero returned ${response.status} - ${response.statusText}`);
                const error = await response2.text();
                return reject(new Error(`EFORMAT - ${error}`));
            }
        }
        catch (e) {
            logger.error(`zotero lookup failed`);
            logger.debug(e);
            return reject(new Error(`EFAIL - zotero connection failed`));
        }
    });
}

module.exports = { zoteroLookup };