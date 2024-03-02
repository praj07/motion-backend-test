
#Setup 

run `npm install` to get all the required packages

For this application to work we need a .env file placed into the root directory of the application with an entry for your meta access token, as follows:
`META_ACCESS_TOKEN=accesstoken123`

Optionally for debugging code a development flag can also be added the environment variables as follows: 
`DEVELOPMENT=1`

#Architecture

The application runs by making a simple axios get request to the meta api endpoint with the provided access token. The resulting response is then parsed, as well as the details for the rate limiting of the application. The parsed user details are stored in a cache if they do not already exist, and if they do exist then the we compare what was retrieved with what is cached to ensure the latest data is available.

In the event that the rate limit is exceeded (or about to be), we switch to serving data completely from the cache for the duration of the rate limit window. This way we still recieve data every 2 seconds as per the requirements even though the rate limit is exceeded. The catch of this solution however is that if a user changes their name or some other detail for example, that change will not be reflected until the rate limiting duration is exceeded. Also the cache is serving data for the entire rate limit window, even though the limit should rollover in slightly less time, this should be fine though since at the very least this will guarantee that we have a fresh "set" of api calls we can make without getting throttled.

#Running the application

Do `npm start` once all the required dependencies are installed.