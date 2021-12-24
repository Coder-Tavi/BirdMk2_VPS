const { Client, CommandInteraction, CommandInteractionOptionResolver, MessageButton, MessageEmbed } = require(`discord.js`);
const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { interactionEmbed, promptMessage } = require("../functions");
const cooldown = new Set();

module.exports = {
  name: `delete`,
  data: new SlashCommandBuilder()
  .setName(`delete`)
  .setDescription(`Deletes a character from the database`)
  .addIntegerOption(option => {
    return option
    .setName(`id`)
    .setDescription(`The ID of the character to delete`)
    .setRequired(true)
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
      
      const buttons = [
        new MessageButton({ customId: `human`, label: `Human`, style: `PRIMARY` }),
        new MessageButton({ customId: `scp`, label: `SCP`, style: `DANGER` })
      ];

      const button = await promptMessage(interaction, 10, buttons, `Please select the type of character you would like to delete`, false);
      if(button.customId === `human`) {
        const character = await client.connection.query(`SELECT * FROM Humans WHERE charId = ?`, [options.getInteger(`id`)])
        .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
        if(character[0].length === 0) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a human with the character ID of ${options.getInteger(`id`)}`, interaction, client, true);
        client.event.emit(`query`, character[0], `${__filename.split("/")[__filename.split("/").length - 1]} 33:56`);
        interaction.followUp({ embeds: [new MessageEmbed({
          title: `Information for ${character[0][0].name}`,
          description: `Created by <@!${character[0][0].author}> (${character[0][0].author})`,
          fields: [
            { name: `Name`, value: character[0][0].name, inline: false },
            { name: `Age`, value: String(character[0][0].age), inline: false },
            { name: `Gender`, value: character[0][0].gender, inline: false },
            { name: `Position`, value: character[0][0].position, inline: false }
          ],
          timestamp: new Date()
        })], ephemeral: true });
        const confirm = await promptMessage(interaction, 10, [new MessageButton({ customId: `yes`, label: `Yes`, style: `DANGER` }), new MessageButton({ customId: `no`, label: `No`, style: `PRIMARY` })], `Are you sure you would like to delete this character?`, true);
        if(confirm.customId === `yes`) {
          const result = await client.connection.query(`DELETE FROM Humans WHERE charId = ?`, [options.getInteger(`id`)])
          .catch(e => interactionEmbed(3, `[SQL-ERR]`, `[${e.code}] ${e.message}`, interaction, client, false));
          if(!result) return;
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 50:55`);
        } else {
          return interaction.editReply({ content: `\:lock: Cancelled` });
        }
      } else if(button.customId === `scp`) {
        const character = await client.connection.query(`SELECT * FROM Anomalies WHERE charId = ?`, [options.getInteger(`id`)])
        .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
        if(character[0].length === 0) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a SCP with the character ID of ${options.getInteger(`id`)}`, interaction, client, true);
        client.event.emit(`query`, character[0], `${__filename.split("/")[__filename.split("/").length - 1]} 58:56`);
        interaction.followUp({ embeds: [new MessageEmbed({
          title: `Information for SCP-${character[0][0].id}`,
          description: `Created by <@!${character[0][0].author}> (${character[0][0].author})`,
          fields: [
            { name: `Name`, value: character[0][0].name, inline: false },
            { name: `Classification`, value: character[0][0].classification, inline: false },
            { name: `Threat`, value: character[0][0].threat, inline: false },
          ],
          timestamp: new Date()
        })], ephemeral: true });
        const confirm = await promptMessage(interaction, 10, [new MessageButton({ customId: `yes`, label: `Yes`, style: `DANGER` }), new MessageButton({ customId: `no`, label: `No`, style: `PRIMARY` })], `Are you sure you would like to delete this character?`, true);
        if(confirm.customId === `yes`) {
          const result = await client.connection.query(`DELETE FROM Anomalies WHERE charId = ?`, [options.getInteger(`id`)])
          .catch(e => interactionEmbed(3, `[SQL-ERR]`, `[${e.code}] ${e.message}`, interaction, client, false));
          if(!result) return;
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 75:55`);
        } else {
          return interaction.editReply({ content: `\:lock: Cancelled` });
        }
      }

      interactionEmbed(1, `Deleted the ${button.customId} character with character ID ${options.getInteger(`id`)}`, ``, interaction, client, false);

      cooldown.add(interaction.user.id);
      setTimeout(() => {
        cooldown.delete(interaction.user.id);
      }, 2500);
    }
  }
}