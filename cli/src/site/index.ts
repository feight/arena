

import type { Environment } from "../environment";


export interface Site{
    id: string;
    path: string;
    environments: Environment[];
}
