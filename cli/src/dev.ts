

import inquirer from "inquirer";

import { getSites } from "./utils/get-sites";
import { cache } from "./cache";


const LAST_SELECTED_SITE_CACHE_KEY = "last-selected-dev-site";


export const dev = async (): Promise<void> => {

    const sites = await getSites();
    const lastSiteId = cache.getKey(LAST_SELECTED_SITE_CACHE_KEY)?.id as string;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lint bug
    const { site } = await inquirer.prompt([{
        choices: sites.map((item) => ({
            name: item.id,
            value: item
        })),
        default: sites.findIndex((item) => item.id === lastSiteId),
        message: "select site",
        name: "site",
        pageSize: 50,
        type: "list"
    }]);

    cache.setKey(LAST_SELECTED_SITE_CACHE_KEY, site);
    cache.save();

    console.log(site);

};
