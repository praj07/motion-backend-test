import dotenv from 'dotenv';
import { axiosClient } from './services/AxiosClient';
import { META_API_CALL_RATE_MS } from './constants/general';
import { API_URLS } from './constants/urls';
import { cache, userDetailsCachedValues } from './services/cache';

const config = dotenv.config().parsed;

const META_ACCESS_TOKEN = config.META_ACCESS_TOKEN;

async function getUserDetails() {
    console.log('Getting the user details')
    while (true) {
        await new Promise(r => setTimeout(r, META_API_CALL_RATE_MS))

        try {
            const metaGetUserDetailsApiResponse = await axiosClient.get(
                API_URLS.META_API.ENDPOINTS.GET_USER_DETAILS,
                {
                    params: {
                        fields: ['id', 'name', 'last_name'].join(','),
                        access_token: META_ACCESS_TOKEN,
                    }
                }
            );

            const userDetails = metaGetUserDetailsApiResponse.data;
            const headers = metaGetUserDetailsApiResponse.headers;
            const appUsage = JSON.parse(headers['x-app-usage']);

            console.log(appUsage);
            console.log(headers);
        } catch (error) {
            console.log('something broke', error);
        }

    };  
}

getUserDetails();