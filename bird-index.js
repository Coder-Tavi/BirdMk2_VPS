const { Client, Collection } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { stripIndents } = require("common-tags");
const { toConsole, interactionEmbed } = require("./functions.js");
const { Routes } = require("discord-api-types/v9");
const EventEmitter = require("events");
const fs = require("fs");
const mysql = require("mysql2/promise");
const wait = require("util").promisify(setTimeout);
const AsciiTable = require("ascii-table");
const config = require("./config.json");
const rest = new REST({ version: 9 }).setToken(config["bot"].token);

// Until the bot is ready, reject anything!
let ready = false;

// Create a new Discord client
const client = new Client({
  intents: ["GUILDS","GUILD_BANS","GUILD_INVITES","GUILD_MEMBERS","GUILD_MESSAGES","GUILD_MESSAGE_REACTIONS"]
});
const slashCommands = [];
client.commands = new Collection();
client.event = new EventEmitter();
(async () => {
  client.connection = await mysql.createConnection({
    host: config["mysql"].host,
    user: config["mysql"].user,
    password: config["mysql"].password,
    database: config["mysql"].database
  });
})();

// Error logging
process.on("exit", async () => {
  const data = stripIndents`An error has occurred within the code and the process has been killed. Below contains some information regarding the issue. Node.js doesn't provide any further data with the [exit] event so this is all generated at the time the event was logged through functions
  
  > Time of incident: ${Date.now()}
  > Date: ${new Date().toUTCString()}`;
  fs.writeFileSync(`./errors/${Date.now()}_exit-log.txt`, data);
});
process.on("uncaughtException", async (err, origin) => {
  const channel = client.channels.cache.get(config.errorChannel);
  if(channel === null) {
    const data = stripIndents`An error has occurred within the code and the process is still running. Below contains some information regarding the issue. [uncaughtException]
  
    > Time of incident: ${Date.now()}
    > Date: ${new Date().toUTCString()}
    > Error: ${err}
    > Origin: ${origin}`;
    fs.writeFileSync(`./errors/${Date.now()}_uncaughtException-log.txt`, data);
  } else {
    toConsole(`An [uncaughtException] has occurred\n\n> ${err}\n> ${origin}`, `${__filename.split("/")[__filename.split("/").length - 1]} 38:12`, client);
  }
});
process.on("unhandledRejection", async (promise) => {
  const channel = client.channels.cache.get(config.errorChannel);
  if(channel === null) {
    const data = stripIndents`An error has occurred within the code and the process is still running. Below contains some information regarding the issue. [unhandledRejection]
  
    > Time of incident: ${Date.now()}
    > Date: ${new Date().toUTCString()}
    > Promise: ${promise}`;
    fs.writeFileSync(`./errors/${Date.now()}_unhandledRejection-log.txt`, data);
  } else {
    toConsole(`An [unhandledRejection] has occurred\n\n> ${promise}`, `${__filename.split("/")[__filename.split("/").length - 1]} 52:12`, client);
  }
});
process.on("warning", async (warning) => {
  const channel = client.channels.cache.get(config["discord"].errorChannel);
  if(channel === null) {
    const data = stripIndents`An error has occurred within the code and the process has been warned. Below contains some information regarding the issue. [warning]
  
    > Time of incident: ${Date.now()}
    > Date: ${new Date().toUTCString()}
    > Name: ${warning.name}
    > Message: ${warning.message}
    > Stack: ${warning.stack}`;
    fs.writeFileSync(`./errors/${Date.now()}_warning-log.txt`, data);
  } else {
    toConsole(`A [warning] has occurred\n\n>>> Warning:\n${warning.name}\n${warning.message}\n\nStacktrace:\n${warning.stack}`, `${__filename.split("/")[__filename.split("/").length - 1]} 65:12`, client);
  }
});
client.event.on("query", async (results, trace) => {
  const channel = client.channels.cache.get(config["discord"].errorChannel);
  const table = new AsciiTable("Query");
  table
    .setHeading("Property", "Value")
    .addRow("Source", trace ?? "? (No trace given)")
    .addRow("Rows Affected", results.affectedRows ?? "?")
    .addRow("Field Count", results.fieldCount ?? "?")
    .addRow("Insert ID", results.insertId ?? "?")
    .addRow("Server Status", results.serverStatus ?? "?")
    .addRow("Warning Status", results.warningStatus ?? "?")
    .addRow("Information", results.info === "" ? "No information" : results.info);
  const data = `${JSON.stringify(results[0], null, 2)}\n===\n\n\`\`\`\n${table.toString()}\n\`\`\``;

  if(channel === null) {
    fs.writeFileSync(`./queries/${Date.now()}_query-log.txt`, data);
  } else {
    toConsole(data, `${__filename.split("/")[__filename.split("/").length - 1]} 80:16`, client);
  }
});

// Prove that the script is running
console.info("[FILE-LOAD] Preparing to register commands");

// Register commands
(async () => {
  const table = new AsciiTable("Commands");
  table.addRow("testing-file.js", "Loaded");
  const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
  console.info(`[FILE-LOAD] Loading files, expecting ${commands.length} files`);

  for(let file of commands) {
    try {
      console.info(`[FILE-LOAD] Loading file ${file}`);
      let command = require(`./commands/${file}`);

      if(command.name) {
        console.info(`[FILE-LOAD] Loaded: ${file}`);
        slashCommands.push(command.data.toJSON());
        client.commands.set(command.name, command);
        table.addRow(command.name, "Loaded");
      }
    } catch(e) {
      console.info(`[FILE-LOAD] Unloaded: ${file}`);
      table.addRow(file, "Unloaded");
    }
  }

  console.info("[FILE-LOAD] All files loaded into ASCII and ready to be sent");
  await wait(500); // Artificial wait to prevent instant sending
  const now = Date.now();

  try {
    console.info("[APP-REFR] Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(config["discord"].applicationId, config["discord"].guildId),
      { body: slashCommands }
    );
    
    const then = Date.now();
    console.info(`[APP-REFR] Successfully reloaded application (/) commands after ${then - now}ms.`);
    console.info(table.toString());
  } catch(error) {
    toConsole(`An error has occurred while attempting to refresh application commands.\n\n> ${error}`, `${__filename.split("/")[__filename.split("/").length - 1]} 90:19`, client);
    console.info(table.toString());
  }
  console.info("[FILE-LOAD] All files loaded successfully");
  ready = true;
})();

// Ready event
client.on("ready", async () => {
  console.info(`[ACT-SET] Client is ready and receiving data from Discord. The logged in Client is: ${client.user.tag}`);
  const presence = await client.user.setActivity({ name: String(`${client.user.username} is starting up!`), type: "PLAYING" });
  process.emitWarning(`[ACT-SET] Client is ready and receiving data from Discord. The logged in Client is: ${client.user.tag}`);
  console.info(`[ACT-SET] Client's presence has been updated to ${presence.activities[0].name}`);

  setInterval(async () => {
    // Reconnect if the mysql connection is dropped
    try {
      await client.connection.execute("SELECT * FROM Humans WHERE charId = '1'");
    } catch(e) {
      client.connection = await mysql.createConnection({
        host: config["mysql"].host,
        user: config["mysql"].user,
        password: config["mysql"].password,
        database: config["mysql"].database
      });
    }
    // Update presence
    await client.guilds.cache.first().members.fetch();
    client.user.setActivity({ name: `over the ${client.guilds.cache.first().members.cache.size} personnel of ${client.guilds.cache.first().name.split(" ")[0]}`, type: "WATCHING" });
  }, 60000);
});

// When an interaction is sent to us
client.on("interactionCreate", async (interaction) => {
  if(!ready) return interaction.editReply({ content: "[CMD-ERR] The bot is still starting up! Please be patient" });
  if(!interaction.guild) return interactionEmbed(2, "[WARN-NODM]", "", interaction, client, false);
  if(interaction.isCommand()) {
    // Defer to keep the Interaction active
    await interaction.deferReply();
    let cmd = client.commands.get(interaction.commandName);
    if(!cmd) return interactionEmbed(2, "[WARN-CMD]", `The command ${interaction.commandName} does not exist in the \`client.commands\` database`, interaction, client, false);
    cmd.run(client, interaction, interaction.options)
      .catch(e => toConsole(`An error occurred while executing the command\n${e}`, `${__filename.split("/")[__filename.split("/").length - 1]} (Running ${cmd.name})`));
    let option = new Array();
    if(interaction.options.data[0].type === "SUB_COMMAND_GROUP") {
      for(const op of interaction.options.data[0].options[0].options) {
        option.push(`[${op.type}] ${op.name}: ${op.value}`);
      }
    } else if(interaction.options.data[0].type === "SUB_COMMAND") {
      for(const op of interaction.options.data[0].options) {
        option.push(`[${op.type}] ${op.name}: ${op.value}`);
      }
    } else {
      for(const op of interaction.options.data) {
        option.push(`[${op.type}] ${op.name}: ${op.value}`);
      }
    }
    toConsole(`[CMD-RUN] ${interaction.user} (ID: ${interaction.user.id}) ran the command \`${interaction.commandName}\` with the options:\n> ${option.join("\n> ")}`, `${__filename.split("/")[__filename.split("/").length - 1]} 118:10`, client);
    // If an error is suspected to have occurred, say so
    await wait(10000);
    await interaction.fetchReply()
      .then(m => {
        if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The command timed out and failed to reply in 10 seconds", interaction, client, false);
      });
  }
});

client.on("messageCreate", async (message) => {
  if(message.content.startsWith("-eval")) {
    if(!message.member.roles.cache.some(r => config.discord["modRoles"].includes(r.id))) return;
    const result = await eval(message.content.slice(6));
    message.reply({ content: `${result ?? "No result"}` });
  }
});

// Login into the Client
client.login(config["bot"].token);