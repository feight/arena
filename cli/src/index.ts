

import { Command } from "commander";

import { dev } from "./dev";


const program = new Command();


program
.name("newsteam")
.description("News Team cli")
.version("0.0.0");


program.command("dev")
.description("Run the dev server")
.action(dev);


program.parse();
