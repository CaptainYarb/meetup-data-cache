# Meetup API Cache
This is a basic REST API to cache groups and events from a Meetup PRO account.

## WIP
This repo is a work in progress and has a few items remaining to make complete the project. 

## Routes:

#### GET `/meetups` 
Gets all listed meetup groups for the configured pro account

#### GET `/upcoming-events`
Gets all upcoming events for meetup groups on the configured pro account. This can take some time if the request is not cached as there are basic rate limiting rules it must adhere to.

#### GET `/meetup/:id/events`
Gets all upcoming events for a specific meetup group by meetup group ID.

### Configuration
Please run `npm install` after cloning this repo. You'll need to set config files or pass environment variables for the following items:

Config File: `/config/meetup.json`
ENV: meetup.api.key="APIKEY"


Config File: `/config/redis.json` (optional if not defaulted)
ENV: redis.host="redis.server"
ENV: redis.port=1234
