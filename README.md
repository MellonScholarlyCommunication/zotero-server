# Metadata Server

An experimental Zotero Service Provider using the [Event Notification](https://www.eventnotifications.net) protocol.

## Install

```
yarn install
```

## Configuration

```
cp .env-example .env
```

## Run the server

```
yarn run server
```

## Add a demo notification to the inbox 

Post an example that should result in successful lookup

```
yarn run post-data 
```

Post an example that should result in a failed lookup

```
yarn run post-fail
```

Example notification:

```
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "urn:uuid:9ec17fd7-f0f1-4d97-b421-29bfad935aad",
  "type": "Offer",
  "published": "2024-08-01T07:00:11.000Z",
  "actor": {
    "id": "http://mycontributions.info/service/m/profile/card#me",
    "name": "Mastodon Bot",
    "inbox": "http://mycontributions.info/service/m/inbox/",
    "type": "Service"
  },
  "object": {
    "id": "https://journal.code4lib.org/articles/17823",
    "type": "Document"
  }
}
```

where `$.object.id` is the URL for which a JSON CSL result should be created.

## Process the inbox

```
yarn run handle-inbox
```

Example outgoing notification:

```
{
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Announce",
    "actor": {
        "id": "http://localhost:8000/profile/card#me",
        "name": "Mastodon Bot",
        "inbox": "http://localhost:8000/inbox/",
        "type": "Service"
    },
    "object": {
        "id": "http://localhost:8000/result/2024/08/12/3b0bace90cea16941d61d696fe4f2a87.json",
        "type": "Document"
    },
    "target": {
        "id": "http://mycontributions.info/service/m/profile/card#me",
        "name": "Mastodon Bot",
        "inbox": "http://mycontributions.info/service/m/inbox/",
        "type": "Service"
    }
}
```

Example service result:

```
[
  {
    "key": "2CL8KBEJ",
    "version": 0,
    "itemType": "journalArticle",
    "creators": [
      {
        "firstName": "Patrick",
        "lastName": "Hochstenbach",
        "creatorType": "author"
      },
      {
        "firstName": "Ruben",
        "lastName": "Verborgh",
        "creatorType": "author"
      },
      {
        "firstName": "Herbert Van de",
        "lastName": "Sompel",
        "creatorType": "author"
      }
    ],
    "tags": [],
    "publicationTitle": "The Code4Lib Journal",
    "ISSN": "1940-5758",
    "url": "https://journal.code4lib.org/articles/17823",
    "title": "Using Event Notifications, Solid and Orchestration for Decentralizing and Decoupling Scholarly Communication",
    "abstractNote": "The paper presents the case for a decentralized and decoupled architecture for scholarly communication. An introduction to the Event Notifications protocol will be provided as being applied in projects such as the international COAR Notify Initiative and the NDE-Usable program by memory institutions in The Netherlands. This paper provides an implementation of Event Notifications using a Solid server. The processing of notifications can be automated using an orchestration service called Koreografeye. Koreografeye will be applied to a citation extraction and relay experiment to show all these tools fit together.",
    "issue": "58",
    "date": "2023-12-04",
    "libraryCatalog": "Code4Lib Journal",
    "accessDate": "2024-08-12T08:43:33Z"
  }
]
```

## Process the outbox

```
yarn run handle-outbox
```

## Clean all processed results

```
yarn real-clean
```