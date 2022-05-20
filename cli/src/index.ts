

import { Command } from "commander";

import { deploy } from "./deploy";
import { dev } from "./dev";


const program = new Command();


program
.name("newsteam")
.description("News Team cli")
.version("0.0.0");


program.command("deploy")
.description("Deploy a site")
.action(deploy);


program.command("dev")
.description("Run the dev server")
.action(dev);


program.parse();
