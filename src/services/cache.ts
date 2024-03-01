import NodeCache from "node-cache";
import { CACHE_TTL_SECONDS } from "../constants/general";

export type userDetailsCachedValues = {
    last_name: string;
    name: string;
    id: string;
};

const cache = new NodeCache({
    stdTTL: CACHE_TTL_SECONDS
});

export { cache }