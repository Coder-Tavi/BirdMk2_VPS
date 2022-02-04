// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { interactionEmbed, departments } = require("../functions.js");
const cooldown = new Set();

module.exports = {
  name: "search",
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Searches for information in the database")
    .addSubcommand(subcommand => {
      return subcommand
        .setName("scp")
        .setDescription("Fetches information regarding an SCP")
        .addIntegerOption(option => {
          return option
            .setName("id")
            .setDescription("SCP's ID (SCP-####)")
            .setRequired(true);
        });
    })
    .addSubcommand(subcommand => {
      return subcommand
        .setName("human")
        .setDescription("Fetches information regarding a human")
        .addStringOption(option => {
          return option
            .setName("name")
            .setDescription("Character's full name (First Last)")
            .setRequired(true);
        });
    })
    .addSubcommand(subcommand => {
      return subcommand
        .setName("author")
        .setDescription("Fetches all characters from a user")
        .addUserOption(option => {
          return option
            .setName("user")
            .setDescription("User to search for")
            .setRequired(true);
        });
    }),
  /**
   * @param {Client} client 
   * @param {CommandInteraction} interaction 
   * @param {CommandInteractionOptionResolver} options 
   */
  run: async (client, interaction, options) => {
    if(cooldown.has(interaction.user.id)) {
      return interactionEmbed(3, "[ERR-CLD]", "You must not have an active cooldown", interaction, client, true);
    } else {
      // Get the subcommand
      const subcommand = options.getSubcommand();

      if(subcommand === "human") {
        const result = await client.connection.query(`select * from Humans where name = "${options.getString("name")}"`)
          .catch(e => interactionEmbed(3, "[SQL-ERR]", `[${e.code}] ${e.message}`, interaction, client, false));
        if(result[0].length === 0) return interactionEmbed(3, "[ERR-MISS]", `No results found for ${options.getString("name")}`, interaction, client, false);
        client.event.emit("query", result, `${__filename.split("/")[__filename.split("/").length - 1]} 58:59`);
        const position = `${result[0][0].department} ${result[0][0].clearance} ${departments[result[0][0].department][result[0][0].clearance]}`;
        // eslint-disable-next-line no-useless-escape
        interaction.editReply({ content: "[CMD-OK] \:lock:", embeds: [ new MessageEmbed({
          title: `Information for ${result[0][0].name}`,
          description: `Created by <@!${result[0][0].author}> (${result[0][0].author})`,
          fields: [
            { name: "Name", value: result[0][0].name, inline: false },
            { name: "Age", value: String(result[0][0].age), inline: false },
            { name: "Gender", value: result[0][0].gender, inline: false },
            { name: "Position", value: position, inline: false }
          ],
          footer: {
            text: `ID: ${result[0][0].charId}`
          },
          timestamp: new Date()
        }) ]});
      } else if(subcommand === "scp") {
        const result = await client.connection.query("select * from Anomalies where id = ?", [options.getInteger("id")])
          .catch(e => interactionEmbed(3, "[SQL-ERR]", `[${e.code}] ${e.message}`, interaction, client, false));
        if(result[0].length === 0) return interactionEmbed(3, "[ERR-MISS]", `No results found for SCP-${options.getInteger("id")}`, interaction, client, false);
        client.event.emit("query", result, `${__filename.split("/")[__filename.split("/").length - 1]} 74:59`);
        // eslint-disable-next-line no-useless-escape
        interaction.editReply({ content: "[CMD-OK] \:lock:", embeds: [ new MessageEmbed({
          title: `Information for SCP-${result[0][0].id}`,
          description: `Created by <@!${result[0][0].author}> (${result[0][0].author})`,
          fields: [
            { name: "Name", value: result[0][0].name, inline: false },
            { name: "Classification", value: result[0][0].classification, inline: false },
            { name: "Threat", value: result[0][0].threat, inline: false },
          ],
          footer: {
            text: `ID: ${result[0][0].charId}`
          },
          timestamp: new Date()
        }) ]});
      } else if(subcommand === "author") {
        const result = await client.connection.execute("select * from Humans where author = ?", [options.getUser("user").id])
          .catch(e => interactionEmbed(3, "[SQL-ERR]", `[${e.code}] ${e.message}`, interaction, client, false));
        client.event.emit("query", result, `${__filename.split("/")[__filename.split("/").length - 1]} 91:59`);
        const embed = new MessageEmbed({
          title: `Characters by ${options.getUser("user").username} (${options.getUser("user").id})`
        });
        for(const human of result[0]) {
          const position = `${human.department} ${human.clearance} ${departments[human.department][human.clearance]}}`;
          embed.addField(human.name, `${position}\n> Age: ${human.age}\n> Gender: ${human.gender}`);
        }
        const result2 = await client.connection.execute("select * from Anomalies where author = ?", [options.getUser("user").id])
          .catch(e => interactionEmbed(3, "[SQL-ERR]", `[${e.code}] ${e.message}`, interaction, client, false));
        client.event.emit("query", result2, `${__filename.split("/")[__filename.split("/").length - 1]} 91:59`);
        for(const scp of result2[0]) {
          embed.addField(`SCP-${scp.id}`, `${scp.name}\n> Classification: ${scp.classification}\n> Threat: ${scp.threat}`);
        }
        interaction.editReply({ embeds: [ embed ] });
      }

      cooldown.add(interaction.user.id);
      setTimeout(() => {
        cooldown.delete(interaction.user.id);
      }, 2500);
    }
  }
};