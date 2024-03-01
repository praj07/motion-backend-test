import axios from "axios";
import { API_URLS } from "../constants/urls";

const metaBaseUrl = API_URLS.META_API.BASE_URL;

const axiosClient = axios.create({
    baseURL: metaBaseUrl,
    headers: {
        Accept: 'application/json'
    }
});

export { axiosClient };