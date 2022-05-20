
import inquirer from "inquirer";
import { outdent } from "outdent";
import chalk from "chalk";

import { getAllSites } from "./site/get-all";
import { cache } from "./utils/cache";
import { exec } from "./utils/exec";

import type { Site } from "./site";
import type { Environment } from "./environment";


const LAST_SELECTED_DEPLOY_SITE_CACHE_KEY = "LAST_SELECTED_DEPLOY_SITE";
const LAST_SELECTED_DEPLOY_ENVIRONMENT_CACHE_KEY = "LAST_SELECTED_DEPLOY_ENVIRONMENT";
const warning = chalk.hex("#FFA500");
const code = chalk.hex("#AAAAAA");


export const deploy = async (): Promise<void> => {

    /**
     * Get a list of sites
     */
    const sites = await getAllSites();

    /**
     * Get the last selected site id in this flow
     */
    const lastSiteId = cache.getKey(LAST_SELECTED_DEPLOY_SITE_CACHE_KEY) as string;

    /**
     * Prompt the user to select a site from the list, with the default selection
     * being the last site that was selected through this flow.
     */
    const { site } = await inquirer.prompt<{ site: Site }>([{
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

    /**
     * Save the last selected site in a cache
     */
    cache.setKey(LAST_SELECTED_DEPLOY_SITE_CACHE_KEY, site.id);

    /**
     * If the site has no configurated environments steer the user towards adding at least one
     */
    if(site.environments.length === 0){

        console.warn(warning(outdent`\n
            No environments config found in sites/${ site.id }

            To deploy this site you need to add at least one environment to your News Team configuration:

            ${ code(outdent`
                {
                    "environments" : [
                        {
                            "id": "string",
                            "name": "string",
                            "project": "Google Cloud project id",
                            "region": "Google Cloud region"
                        }
                    ]
                }
            `) }
            ${ "" /* eslint-disable-next-line max-len -- acceptable */ }
            You can add it to a 'newsteamrc', 'newsteamrc.json' or 'newsteamrc.js' file in the root of your site or to a "newsteam" property in the site's package.json

        \n`));

    }

    /**
     * Get the last selected environment id in this flow
     */
    const environmentCacheKey = `${ LAST_SELECTED_DEPLOY_ENVIRONMENT_CACHE_KEY }-${ site.id.replace(/[\W_]+/gu, "-") }`;
    const lastEnvironment = cache.getKey(environmentCacheKey) as string;

    /**
     * Prompt the user to select an environment from the list, with the default selection
     * being the last environment that was selected through this flow.
     */
    const { environment } = await inquirer.prompt<{ environment: Environment }>([{
        choices: site.environments.map((item) => ({
            name: item.id,
            value: item
        })),
        default: site.environments.findIndex((item) => item.id === lastEnvironment),
        message: "select environment",
        name: "environment",
        pageSize: 50,
        type: "list"
    }]);

    /**
     * Save the last selected environmet id in a cache
     */
    cache.setKey(environmentCacheKey, environment.id);

    /**
     * Save the cache (only save after all sets have been completed)
     */
    cache.save();

    const name = site.id.replace(/[\W_]+/gu, "-").toLowerCase();
    const tag = `gcr.io/${ environment.project }/${ name }`;

    await exec("gcloud config set builds/use_kaniko False");
    await exec("gcloud config set builds/kaniko_cache_ttl 720");

    await exec([
        "gcloud builds submit",
        `--project ${ environment.project }`,
        `--config ${ site.path }/cloudbuild.yaml`,
        `--ignore-file ${ site.path }/.dockerignore`
    ].join(" "));

    /*
     * Await exec([
     *     "gcloud builds submit",
     *     `--project ${ environment.project }`,
     *     `--tag ${ tag }`,
     *     site.path
     * ].join(" "));
     */

    await exec([
        `gcloud run deploy ${ name }`,
        `--project ${ environment.project }`,
        `--region ${ environment.region }`,
        "--platform managed",
        `--image ${ tag }`,
        "--allow-unauthenticated"
    ].join(" "));

};
