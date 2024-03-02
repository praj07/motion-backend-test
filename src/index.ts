import dotenv from "dotenv";
import { axiosClient } from "./services/AxiosClient";
import {
  META_API_CALL_RATE_MS,
  META_THROTTLE_ROLLING_WINDOW_TIME_MS,
  META_USER_PROFILE_PARAMS,
} from "./constants/general";
import { API_URLS } from "./constants/urls";
import { cache, userDetailsCachedValues } from "./services/cache";
import _ from "lodash";

const config = dotenv.config().parsed;

const META_ACCESS_TOKEN = config.META_ACCESS_TOKEN;
const IS_DEVELOPMENT_ENVIRONMENT = config.DEVELOPMENT;

const THRESHOLD_PERCENTAGE_OF_LIMIT = 98; // 98% of our limit will be our cutoff before we start serving from the cache

type appUsageHeader = {
  call_count: number;
  total_cpu_time: number;
  total_time: number;
};

async function serveUserDetailsFromCache() {
  // we want this function to be running for the duration of the rate limit window
  if (IS_DEVELOPMENT_ENVIRONMENT) console.log(`serveUserDetailsFromCache`);
  const startTime = Date.now();
  let hasRateLimitWindowPassed = false;
  while (!hasRateLimitWindowPassed) {
    await new Promise((r) => setTimeout(r, META_API_CALL_RATE_MS));
    const cachedUserDetails: userDetailsCachedValues | null =
      cache.get(META_ACCESS_TOKEN);

    console.log(cachedUserDetails);
    const currentTime = Date.now();
    // only stop looping once duration of the rate limit window has passed
    hasRateLimitWindowPassed =
      currentTime - startTime >= META_THROTTLE_ROLLING_WINDOW_TIME_MS;
  }
  console.log(`rate limit window duration window passed, returning to main loop`);
}

async function getUserDetails() {
  console.log("Getting the user details");
  while (true) {
    //timeout for 2 seconds before attempting to call the api
    await new Promise((r) => setTimeout(r, META_API_CALL_RATE_MS));

    try {
      //make our API call to get user details
      const metaGetUserDetailsApiResponse = await axiosClient.get(
        API_URLS.META_API.ENDPOINTS.GET_USER_DETAILS,
        {
          params: {
            fields: META_USER_PROFILE_PARAMS.join(","),
            access_token: META_ACCESS_TOKEN,
          },
        }
      );

      //get user details from response + app usage stats ot hand rate limiting
      const userDetails: userDetailsCachedValues =
        metaGetUserDetailsApiResponse.data;

      const headers = metaGetUserDetailsApiResponse.headers;
      const appUsageData: appUsageHeader = JSON.parse(headers["x-app-usage"]);

      // store details in the cache so that if we're rate limited we can still serve details.
      const cachedDetails: userDetailsCachedValues | null =
        cache.get(META_ACCESS_TOKEN);

      if (!cachedDetails) {
        cache.set(META_ACCESS_TOKEN, {
          ...userDetails,
        });
      } else {
        // if the details of the user change (name change?) then we want to make sure our cache reflects that
        if (!_.isEqual(cachedDetails, userDetails)) {
          cache.set(META_ACCESS_TOKEN, {
            ...userDetails,
          });
        }
      }

      // If we get really close to the rate limit, we can just serving from the cache.
      if (
        appUsageData.call_count > THRESHOLD_PERCENTAGE_OF_LIMIT ||
        appUsageData.call_count > THRESHOLD_PERCENTAGE_OF_LIMIT ||
        appUsageData.total_cpu_time > THRESHOLD_PERCENTAGE_OF_LIMIT
      ) {
        await serveUserDetailsFromCache();
      }

      // if everything is good then we log out the details
      console.log(userDetails);
      if (IS_DEVELOPMENT_ENVIRONMENT) console.log(appUsageData);
    } catch (error) {
      //should never happen in single application because we're stopping requests at 98% of our limit, but just in case
      if (error.res?.status == 429) {
        console.log(
          "Rate limit reached serve details from cache for 1 hour until rate limits reset"
        );
        await serveUserDetailsFromCache();
      } else if (error.res?.status == 400 || error.message.includes(400)) {
        console.log(`Invalid access token or the access token is expired`);
      } else {
        console.log("Unhandled error:", error.message);
      }
      // TODO: if
    }
  }
}

getUserDetails();
