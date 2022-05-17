

import path from "path";

import { rcFile } from "rc-config-loader";
import fse from "fs-extra";


const rcName = "newsteam";


export interface Site{
    id: string;
    path: string;
}


export const getSites = async (): Promise<Site[]> => {

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- safe
    const siteFolderNames = await fse.readdir(path.join(process.cwd(), "sites"));

    const sitePaths = siteFolderNames
    // eslint-disable-next-line security/detect-non-literal-fs-filename, node/no-sync -- safe and performant
    .filter((item) => fse.statSync(path.join(process.cwd(), "sites", item)).isDirectory())
    .map((item) => path.join(process.cwd(), "sites", item));


    return sitePaths.map((sitePath) => ({
        ...rcFile(rcName, {
            cwd: sitePath,
            defaultExtension: ".json",
            packageJSON: {
                fieldName: rcName
            }
        })?.config,
        id: sitePath.split("/").at(-1)!,
        path: sitePath
    }));

};
