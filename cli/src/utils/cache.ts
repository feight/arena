
import path from "path";
import url from "url";

import flatCache from "flat-cache";


export const cache = flatCache.load("cache", path.resolve(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "../.cache")));
