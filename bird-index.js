const { Client, Collection } = require(`discord.js`);
const { REST } = require(`@discordjs/rest`);
const { stripIndents } = require(`common-tags`);
const { toConsole, interactionEmbed, messageEmbed } = require(`./functions.js`);
const { Routes } = require(`discord-api-types/v9`);
const fs = require(`fs`);
const wait = require(`util`).promisify(setTimeout);
const AsciiTable = require(`ascii-table`);
const config = require(`./config.json`);
const rest = new REST({ version: 9 }).setToken(config.token);

// Create a new Discord client
const client = new Client({
  partials: [`MESSAGE`, `CHANNEL`, `REACTION`],
  intents: [`GUILDS`,`GUILD_BANS`,`GUILD_INVITES`,`GUILD_MEMBERS`,`GUILD_MESSAGES`,`GUILD_MESSAGE_REACTIONS`]
});
const slashCommands = [];
client.commands = new Collection();

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
    toConsole(`An [uncaughtException] has occurred\n\n> ${err}\n> ${origin}`, `bird-index.js 26:11`, client);
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
    toConsole(`An [unhandledRejection] has occurred\n\n> ${err}\n> ${origin}`, `bird-index.js 39:12`, client);
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
    toConsole(`A [warning] has occurred\n\n>>> Warning:\n${warning.name}\n${warning.message}\n\nStacktrace:\n${warning.stack}`, `bird-index.js 55:12`, client);
  }
})

// So I accidentally don't perform <Whatever>(async => {...})
// It's not necessary but it can happen
console.log(`[FILE-LOAD] Preparing to register commands`);

// Register commands
(async () => {
  const table = new AsciiTable(`Commands`);
  table.addRow(`testing-file.js`, `Loaded`);
  const commands = fs.readdirSync(`./commands`).filter(file => file.endsWith(`.js`));
  console.log(`[FILE-LOAD] Loading files, expecting ${commands.length} files`)

  for(let file of commands) {
    try {
      let command = require(`./commands/${file}`);

      if(command.name) {
        slashCommands.push(command.data.toJSON());
        client.commands.set(command.name, command);
        table.addRow(command.name, `Loaded`);
      }
    } catch(e) {
      table.addRow(file, `Unloaded`);
    }
  }

  console.log(`[FILE-LOAD] All files loaded into ASCII and ready to be sent`)
  await wait(500); // Artificial wait to prevent instant sending
  const now = Date.now();

  try {
    console.log(`[APP-REFR] Started refreshing application (/) commands.`);

    await rest.put(
      Routes.applicationCommands(config.applicationId),
      { body: slashCommands }
    );
    
    const then = Date.now();
    console.log(`[APP-REFR] Successfully reloaded application (/) commands after ${then - now}ms.`);
    console.log(table.toString());
  } catch(error) {
    toConsole(`An error has occurred while attempting to refresh application commands.\n\n> ${error}`, `bird-index.js 90:19`, client);
    console.info(table.toString());
  }
  console.log(`[FILE-LOAD] All files loaded successfully`);
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
  }, 20000)
});

// When an interaction is sent to us
client.on(`interactionCreate`, async (interaction) => {
  if(!interaction.guild) return interactionEmbed(2, `[WARN-NODM]`, ``, interaction, client, false);
  if(interaction.isCommand()) {
    // Defer to keep the Interaction active
    await interaction.deferReply();
    let cmd = client.commands.get(interaction.commandName);
    cmd.run(client, interaction, interaction.options);
    toConsole(`[CMD-RUN] ${interaction.user} (ID: ${interaction.user.id}) ran the command \`${interaction.commandName}\``, `bird-index.js 118:10`, client);
  }
});

// When a command is run
client.on(`messageCreate`, async (message) => {
  let prefix = config.prefix;
  let args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  // Ignoring statements
  if(!message.guild) return messageEmbed(2, `[WARN-NODM]`, ``, message, client);
  if(!message.content.startsWith(prefix)) return;
  if(message.author.bot) return;

  // Get the command and return if there is none
  let command = client.commands.get(cmd);
  if(!command) return;
  if(command.length === 0) return;

  // Execute the command and log it
  command.execute(client, message, args);
  toConsole(`[CMD-EXC] ${message.author} (ID: ${message.author.id}) ran the command \`${command.name}\``, `bird-index.js 139:10`, client);
});

// Login into the Client
client.login(config.token);