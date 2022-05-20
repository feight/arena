import path from "path";

import inquirer from "inquirer";
import yaml from "yaml";
import fse from "fs-extra";
import waitOn from "wait-on";
import openBrowser from "react-dev-utils/openBrowser";
import { outdent } from "outdent";
import chalk from "chalk";

import { getAllSites } from "./site/get-all";
import { cache } from "./utils/cache";
import { exec } from "./utils/exec";

import type { Site } from "./site";


const LAST_SELECTED_DEV_SITE_CACHE_KEY = "LAST_SELECTED_DEV_SITE";
const CLOSE_DELAY = 500;
const warning = chalk.hex("#FFA500");


interface DockerComposeService{
    /* eslint-disable @typescript-eslint/naming-convention -- docker did this */
    build: {
        context: string;
        target: string;
    };
    container_name?: string;
    entrypoint: string;
    environment?: {
        PORT?: string;
    };
    ports: string[];
    volumes?: string[];
    /* eslint-enable @typescript-eslint/naming-convention */
}


export const dev = async (): Promise<void> => {

    /**
     * Get a list of sites
     */
    const sites = await getAllSites();

    /**
     * Get the last selected site id in this flow
     */
    const lastSiteId = cache.getKey(LAST_SELECTED_DEV_SITE_CACHE_KEY)?.id as string;

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
    cache.setKey(LAST_SELECTED_DEV_SITE_CACHE_KEY, site);

    /**
     * Save the cache (only save after all sets have been completed)
     */
    cache.save();

    /**
     * Get the selected site's docker file if one exists
     */
    const dockerYmlFilePath = path.join(site.path, "docker-compose.yml");
    const dockerYamlFilePath = path.join(site.path, "docker-compose.yaml");
    const dockerYmlExists = await fse.pathExists(dockerYmlFilePath);
    const dockerYamlExists = await fse.pathExists(dockerYamlFilePath);

    /**
     * If the selected site's docker file doesn't exist quit with a message
     * because we can't
     */
    if(!dockerYmlExists && !dockerYamlExists){

        console.error(`Could not find a docker-compose.yaml in sites/${ site.id }`);

        return;

    }

    /**
     * Get the PORT environment variable from the www service in the site's docker-compose.y{a}ml
     * and message the user if this isn't configured correctly
     */
    const dockerComposeYamlPath = dockerYmlExists ? dockerYmlFilePath : dockerYamlFilePath;
    const dockerComposeBuffer = await fse.readFile(dockerComposeYamlPath);
    const dockerComposeData = yaml.parse(dockerComposeBuffer.toString()) as { services?: Record<string, DockerComposeService> };
    const service: DockerComposeService | undefined = dockerComposeData.services ? dockerComposeData.services.www : undefined;
    const port = service?.environment?.PORT;

    if(!service){

        console.warn(warning(outdent`\n
            No service 'www' declared in sites/${ site.id }/docker-compose.yml
            Automatic opening of http://localhost:{PORT} failed
        \n`));

    }else if(!port){

        console.error(warning(outdent`\n
            No {PORT} environment variable declared in service 'www' in sites/${ site.id }/docker-compose.yml
            Automatic opening of http://localhost:{PORT} failed
        \n`));

    }

    await exec("docker build shared -t shared");

    await Promise.all([

        /**
         * Make the users default browser open up the www service once it's running
         */
        (async (): Promise<void> => {

            await exec([
                "docker",
                "compose",
                "--file",
                dockerComposeYamlPath,
                "up",
                "--build"
            ].join(" "));

            setTimeout(() => {

                // eslint-disable-next-line node/no-process-exit -- makes sense here
                process.exit();

            }, CLOSE_DELAY);

        })(),

        /**
         * Make the users default browser open up the www service once it's running
         */
        (async (): Promise<void> => {

            const url = `http://localhost:${ port! }`;

            await waitOn({ resources: [url] });

            openBrowser(url);

        })()

    ]);

};
