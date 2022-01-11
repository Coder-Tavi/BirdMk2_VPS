const { Client, Collection } = require(`discord.js`);
const { REST } = require(`@discordjs/rest`);
const { stripIndents } = require(`common-tags`);
const { toConsole, interactionEmbed } = require(`./functions.js`);
const { Routes } = require(`discord-api-types/v9`);
const EventEmitter = require('events');
const fs = require(`fs`);
const mysql = require(`mysql2/promise`);
const wait = require(`util`).promisify(setTimeout);
const AsciiTable = require(`ascii-table`);
const config = require(`./config.json`);
const rest = new REST({ version: 9 }).setToken(config.token);

// Until the bot is ready, reject anything!
let ready = false;

// Create a new Discord client
const client = new Client({
  intents: [`GUILDS`,`GUILD_BANS`,`GUILD_INVITES`,`GUILD_MEMBERS`,`GUILD_MESSAGES`,`GUILD_MESSAGE_REACTIONS`]
});
const slashCommands = [];
client.commands = new Collection();
client.event = new EventEmitter();
(async () => {
  client.connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
  });
})();

// Error logging
process.on(`exit`, async () => {
  const data = stripIndents`An error has occurred within the code and the process has been killed. Below contains some information regarding the issue. Node.js doesn't provide any further data with the [exit] event so this is all generated at the time the event was logged through functions
  
  > Time of incident: ${Date.now()}
  > Date: ${new Date().toUTCString()}`;
  fs.writeFileSync(`./errors/${Date.now()}_exit-log.txt`, data);
});
process.on(`uncaughtException`, async (err, origin) => {
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
process.on(`unhandledRejection`, async (promise) => {
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
process.on(`warning`, async (warning) => {
  const channel = client.channels.cache.get(config.errorChannel);
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
})
client.event.on(`query`, async (results, trace) => {
  const channel = client.channels.cache.get(config.errorChannel);
  const table = new AsciiTable(`Query`);
  table
  .setHeading(`Property`, `Value`)
  .addRow(`Source`, trace ?? `? (No trace given)`)
  .addRow(`Rows Affected`, results.affectedRows ?? `?`)
  .addRow(`Field Count`, results.fieldCount ?? `?`)
  .addRow(`Insert ID`, results.insertId ?? `?`)
  .addRow(`Server Status`, results.serverStatus ?? `?`)
  .addRow(`Warning Status`, results.warningStatus ?? `?`)
  .addRow(`Information`, results.info === `` ? `No information` : results.info)
  const data = `${JSON.stringify(results[0], null, 2)}\n===\n\n\`\`\`\n${table.toString()}\n\`\`\``;

  if(channel === null) {
    fs.writeFileSync(`./queries/${Date.now()}_query-log.txt`, data);
  } else {
    toConsole(data, `${__filename.split("/")[__filename.split("/").length - 1]} 80:16`, client);
  }
});

// Prove that the script is running
console.log(`[FILE-LOAD] Preparing to register commands`);

// Register commands
(async () => {
  const table = new AsciiTable(`Commands`);
  table.addRow(`testing-file.js`, `Loaded`);
  const commands = fs.readdirSync(`./commands`).filter(file => file.endsWith(`.js`));
  console.log(`[FILE-LOAD] Loading files, expecting ${commands.length} files`)

  for(let file of commands) {
    try {
      console.log(`[FILE-LOAD] Loading file ${file}`);
      let command = require(`./commands/${file}`);

      if(command.name) {
        console.info(`[FILE-LOAD] Loaded: ${file}`);
        slashCommands.push(command.data.toJSON());
        client.commands.set(command.name, command);
        table.addRow(command.name, `Loaded`);
      }
    } catch(e) {
      console.log(`[FILE-LOAD] Unloaded: ${file}`);
      table.addRow(file, `Unloaded`);
    }
  }

  console.log(`[FILE-LOAD] All files loaded into ASCII and ready to be sent`)
  await wait(500); // Artificial wait to prevent instant sending
  const now = Date.now();

  try {
    console.log(`[APP-REFR] Started refreshing application (/) commands.`);

    await rest.put(
      Routes.applicationGuildCommands(config.applicationId, config.guildId),
      { body: slashCommands }
    );
    
    const then = Date.now();
    console.log(`[APP-REFR] Successfully reloaded application (/) commands after ${then - now}ms.`);
    console.log(table.toString());
  } catch(error) {
    toConsole(`An error has occurred while attempting to refresh application commands.\n\n> ${error}`, `${__filename.split("/")[__filename.split("/").length - 1]} 90:19`, client);
    console.info(table.toString());
  }
  console.log(`[FILE-LOAD] All files loaded successfully`);
  ready = true;
})();

// Ready event
client.on(`ready`, async () => {
  console.log(`[ACT-SET] Client is ready and receiving data from Discord. The logged in Client is: ${client.user.tag}`);
  const presence = await client.user.setActivity({ name: String(`${client.user.username} is starting up!`), type: `PLAYING` });
  process.emitWarning(`[ACT-SET] Client is ready and receiving data from Discord. The logged in Client is: ${client.user.tag}`);
  console.log(`[ACT-SET] Client's presence has been updated to ${presence.activities[0].name}`);

  setInterval(async () => {
    await client.guilds.cache.first().members.fetch();
    client.user.setActivity({ name: `over the ${client.guilds.cache.first().members.cache.size} personnel of ${client.guilds.cache.first().name.split(" ")[0]}`, type: `WATCHING` });

    if(client.connection._closing === true) {
      toConsole(`The connection has been closed or is closing. The connection will be ended and a new one will be opened!`, `${__filename.split("/")[__filename.split("/").length - 1]} 166:16`, client);
      await client.connection.end();
      client.connection = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database
      });
    }
  }, 20000)
});

// When an interaction is sent to us
client.on(`interactionCreate`, async (interaction) => {
  if(!ready) return interaction.editReply({ content: `[CMD-ERR] The bot is still starting up! Please be patient` });
  if(!interaction.guild) return interactionEmbed(2, `[WARN-NODM]`, ``, interaction, client, false);
  if(interaction.isCommand()) {
    // Defer to keep the Interaction active
    await interaction.deferReply();
    let cmd = client.commands.get(interaction.commandName);
    if(!cmd) return interactionEmbed(2, `[WARN-CMD]`, `The command ${interaction.commandName} does not exist in the \`client.commands\` database`, interaction, client, false);
    cmd.run(client, interaction, interaction.options);
    toConsole(`[CMD-RUN] ${interaction.user} (ID: ${interaction.user.id}) ran the command \`${interaction.commandName}\``, `${__filename.split("/")[__filename.split("/").length - 1]} 118:10`, client);
  }
});

// Login into the Client
client.login(config.token);