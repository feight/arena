

import { spawn } from "child_process";

import chalk from "chalk";


export const exec = async (command: string): Promise<void> => new Promise((resolve) => {

    console.log(chalk.green(command));

    const child = spawn(
        command.split(" ")[0],
        command.split(" ").slice(1),
        {
            stdio: "inherit"
        }
    );

    child.stdout?.pipe(process.stdout);

    process.on("SIGINT", () => {

        child.kill("SIGINT");

        resolve();

    });

    child.on("close", () => {

        resolve();

    });

});
