

import path from "path";

import { rcFile } from "rc-config-loader";
import fse from "fs-extra";

import type { Site } from ".";


const rcName = "newsteam";


export const getAllSites = async (): Promise<Site[]> => {

    const siteFolderNames = await fse.readdir(path.join(process.cwd(), "sites"));

    const sitePaths = siteFolderNames
    // eslint-disable-next-line node/no-sync -- performant in this case
    .filter((item) => fse.statSync(path.join(process.cwd(), "sites", item)).isDirectory())
    .map((item) => path.join(process.cwd(), "sites", item));

    const sites = sitePaths.map((sitePath) => {

        const rc = rcFile<Partial<Site>>(rcName, {
            cwd: sitePath,
            defaultExtension: ".json",
            packageJSON: {
                fieldName: rcName
            }
        });

        return {
            environments: rc?.config.environments ?? [],
            id: sitePath.split("/").at(-1)!,
            path: sitePath
        };

    });

    sites.sort((siteA, siteB) => {

        if(siteA.id < siteB.id){
            return -1;
        }

        if(siteA.id > siteB.id){
            return 1;
        }

        return 0;

    });

    return sites;

};
