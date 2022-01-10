const { Client, CommandInteraction, CommandInteractionOptionResolver } = require(`discord.js`);
const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { interactionEmbed, departments } = require("../functions");
const cooldown = new Set();

module.exports = {
  name: `register`,
  data: new SlashCommandBuilder()
  .setName(`register`)
  .setDescription(`Registers a character, storing it in the database`)
  .addSubcommand(subcommand => {
    return subcommand
    .setName(`human`)
    .setDescription(`Registers a human`)
    .addUserOption(option => {
      return option
      .setName(`author`)
      .setDescription(`The author of the character`)
      .setRequired(true)
    })
    .addStringOption(option => {
      return option
      .setName(`name`)
      .setDescription(`Character's full name (First Last)`)
      .setRequired(true);
    })
    .addIntegerOption(option => {
      return option
      .setName(`age`)
      .setDescription(`Age of the character`)
      .setRequired(true);
    })
    .addStringOption(option => {
      return option
      .setName(`gender`)
      .setDescription(`Character's gender`)
      .setRequired(true);
    })
    .addStringOption(option => {
      return option
      .setName(`department`)
      .setDescription(`Department the character is a part of`)
      .setRequired(true)
      .addChoices([
        ["Administrative Department", "AD"],
        ["Security Department", "SD"],
        ["Scientific Department", "ScD"],
        ["Mobile Task Force", "MTF"],
        ["Medical Department", "MD"],
        ["Engineering and Technical Services", "ETS"],
        ["Ethics Committee", "EC"],
        ["Intelligence Agency", "IA"],
        ["Janitorial Staff", "JS"],
        ["Class D Personnel", "CD"],
        ["Chaos Insurgency", "CI"]
      ])
    })
    .addStringOption(option => {
      return option
      .setName(`clearance`)
      .setDescription(`The clearance level of the character`)
      .setRequired(true)
      .addChoices([
        ["N/A", "N/A"],
        ["CL-0", "CL-0"],
        ["CL-1", "CL-1"],
        ["CL-2", "CL-2"],
        ["CL-3A", "CL-3A"],
        ["CL-3B", "CL-3B"],
        ["CL-4A", "CL-4A"],
        ["CL-4B", "CL-4B"],
        ["CL-5", "CL-5"]
      ])
    })
  })
  .addSubcommand(subcommand => {
    return subcommand
    .setName(`scp`)
    .setDescription(`Registers an SCP`)
    .addUserOption(option => {
      return option
      .setName(`author`)
      .setDescription(`The author of the SCP`)
      .setRequired(true)
    })
    .addIntegerOption(option => {
      return option
      .setName(`id`)
      .setDescription(`SCP's identification number (SCP-####)`)
      .setRequired(true);
    })
    .addStringOption(option => {
      return option
      .setName(`name`)
      .setDescription(`Name or nickname of the SCP`)
      .setRequired(true);
    })
    .addStringOption(option => {
      return option
      .setName(`containment_class`)
      .setDescription(`Containment classification of the SCP`)
      .setRequired(true)
      .addChoices([
        ["Safe", "Safe"],
        ["Euclid", "Euclid"],
        ["Keter", "Keter"],
        ["Apollyon", "Apollyon"],
        ["Thaumiel", "Thaumiel"],
        ["Neutralized", "Neutralized"],
      ])
    })
    .addStringOption(option => {
      return option
      .setName(`threat_level`)
      .setDescription(`Threat level of the SCP`)
      .setRequired(true)
      .addChoices([
        ["White", "White"],
        ["Blue", "Blue"],
        ["Green", "Green"],
        ["Yellow", "Yellow "],
        ["Orange", "Orange"],
        ["Red", "Red"],
        ["Black", "Black"],
        ["Undetermined", "Undetermined"]
      ])
    })
  }),
  /**
   * @param {Client} client 
   * @param {CommandInteraction} interaction 
   * @param {CommandInteractionOptionResolver} options 
   */
  run: async (client, interaction, options) => {
    if(cooldown.has(interaction.user.id)) {
      return interactionEmbed(3, `[ERR-CLD]`, `You must not have an active cooldown`, interaction, client, true);
    } else {
      // If the user lacks permissions, return an error
      if(!interaction.member.permissions.has(`MANAGE_ROLES`)) return interactionEmbed(3, `[ERR-UPRM]`, `Missing: \`Manage Roles\``, interaction, client, true);

      // Get the subcommand
      const subcommand = options.getSubcommand();
      // If a human was submitted
      if(subcommand === `human`) {
        // If there is no match, return an error
        if(departments[options.getString(`department`)][options.getString(`clearance`)] === undefined) return interactionEmbed(3, `[ERR-MISS]`, `Invalid department and clearance level`, interaction, client, true);
        const result = await client.connection.execute(`insert into Humans(author, name, age, gender, department, clearance) values("${options.getUser(`author`).id}", "${options.getString(`name`)}", ${parseInt(options.getInteger(`age`))}, "${options.getString(`gender`)}", "${options.getString(`department`)}", "${options.getString(`clearance`)}")`)
        .catch(e => interactionEmbed(3, `[SQL-ERR]`, `[${e.code}] ${e.message}`, interaction, client, false));
        if(!result) return;
        client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 124:55`)
      } else { // If an SCP was submitted
        const result = await client.connection.execute(`insert into Anomalies(author, id, name, classification, threat) values("${options.getUser(`author`).id}", ${options.getInteger(`id`)}, "${options.getString(`name`)}", "${options.getString(`containment_class`)}", "${options.getString(`threat_level`)}")`)
        .catch(e => interactionEmbed(3, `[SQL-ERR]`, `[${e.code}] ${e.message}`, interaction, client, false));
        if(!result) return;
        client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 128:55`)
      }

      // If no fails occurred, return an OK message
      interactionEmbed(1, `[QUERY-OK] Created a ${subcommand.toLowerCase()} character added it to the database`, ``, interaction, client, false);

      cooldown.add(interaction.user.id);
      setTimeout(() => {
        cooldown.delete(interaction.user.id);
      }, 2500);
    }
  }
}