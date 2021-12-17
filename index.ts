//@ts-ignore
import { MinecraftPacketIds } from "bdsx";
import { events } from "bdsx/event";
import { performance } from "perf_hooks";
import { Color } from "colors";

import { stdout } from "process";

function logData(data: string, level?: string, color?: keyof Color) {
	let date = `${new Date()
		.toISOString()
		.replace(/T/, " ")
		.replace(/\..+/, "")}:${performance
		.now()
		.toString()
		.split(".")[0]
		.slice(-3)}`;
	let message = `[${date} ${level?.toUpperCase() || "SCRIPT"}] ${data}\n\r`;
	stdout.write(message[color || "italic"] as string);
}

let system = server.registerSystem(0, 0);

function runCommand(command: string): Promise<IExecuteCommandCallback> {
	return new Promise((resolve) => {
		system.executeCommand(command, (result) => {
			resolve(result);
		});
	});
}

system.executeCommand("time query day", (result) => {
	logData(JSON.stringify(result), "result", "yellow");
});

logData("script started", "init", "cyan");

let voted: string[] = [];

events
	.packetBefore(MinecraftPacketIds.Text)
	.on(async (packet, networkIdentifier) => {
		let prefix = "*";
		let name: string = packet.name;
		let message: string = packet.message;
		if (message[0] === prefix) {
			logData(`${name}: ${message}`, "request", "blue");
			let [command, ...args] = message.split(" ");
			switch (command) {
				case "skip": {
					if (voted.indexOf(name) !== -1) return;
					let currentTime = (await runCommand("time query day")).data.data;
					if (currentTime < 13000) return;
					let players: string[] = []; //get as an array of names
					let majorityRequired = Math.round(players.length / 2) + 1;
					voted.push(name);
					if (voted.length >= majorityRequired) {
						//skip
						logData(
							JSON.stringify(await runCommand("time set 23000")),
							"result",
							"yellow"
						);
						voted = [];
					}
					break;
				}
				default: {
					//send error message
					return;
				}
			}
		} else {
			logData(`${name}: ${message}`, "text", "green");
		}
	});
