const { Client, CommandInteraction, CommandInteractionOptionResolver, MessageButton } = require(`discord.js`);
const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { interactionEmbed, promptMessage } = require(`../functions.js`);
const cooldown = new Set();

module.exports = {
  name: `update`,
  data: new SlashCommandBuilder()
  .setName(`update`)
  .setDescription(`Updates a character's information`)
  .addIntegerOption(option => {
    return option
    .setName(`id`)
    .setDescription(`The ID of the character to update`)
    .setRequired(true)
  }),
  /**
   * @param {Client} client 
   * @param {CommandInteraction} interaction 
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    if(cooldown.has(interaction.member.id)) {
      return interactionEmbed(3, `[ERR-CLD]`, `You must not have an active cooldown`, interaction, client, true);
    } else {
      // If the user lacks permissions, return an error
      if(!interaction.member.permissions.has(`MANAGE_ROLES`)) return interactionEmbed(3, `[ERR-UPRM]`, `Missing: \`Manage Roles\``, interaction, client, true);

      let button = await promptMessage(interaction, 10, [new MessageButton({ customId: `human`, label: `Human`, style: `SUCCESS` }), new MessageButton({ customId: `scp`, label: `SCP`, style: `DANGER` })], `Which type of character do you want to update?`, false);
      const filter = m => m.author.id === interaction.user.id;

      if(button.customId === `human`) {
        button = await promptMessage(interaction, 10, [
          new MessageButton({ customId: `name`, label: `Name`, style: `DANGER` }),
          new MessageButton({ customId: `position`, label: `Position`, style: `PRIMARY`, disabled: true }),
          new MessageButton({ customId: `age`, label: `Age`, style: `SECONDARY` }),
          new MessageButton({ customId: `gender`, label: `Gender`, style: `SECONDARY` })
        ], `Which information do you want to update?`, true);
        if(button.customId === `name`) {
          await interaction.editReply({ content: `What is the new name of the character?` });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          if(m.stack) return interaction.editReply({ content: `:x: You took too long to respond.` });
          const result = await client.connection.execute(`update Humans set name = "${m.first().content}" where charId = ${options.getInteger(`id`)}`)
          .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
          console.log(result);
          if(!result) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a human with the character ID of ${options.getInteger(id)}`, interaction, client, true);
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 42:57`);
          await m.delete();
        } else if(button.customId === `age`) {
          await interaction.editReply({ content: `What is the new age of the character?` });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          if(m.stack) return interaction.editReply({ content: `:x: You took too long to respond.` });
          const result = await client.connection.execute(`update Humans set age = ${m.first().content} where charId = ${options.getInteger(`id`)}`)
          .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
          console.log(result);
          if(!result) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a human with the character ID of ${options.getInteger(id)}`, interaction, client, true);
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 52:57`);
          await m.delete();
        } else if(button.customId === `gender`) {
          await interaction.editReply({ content: `What is the new gender of the character?` });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          if(m.stack) return interaction.editReply({ content: `:x: You took too long to respond.` });
          const result = await client.connection.execute(`update Humans set gender = "${m.first().content}" where charId = ${options.getInteger(`id`)}`)
          .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
          console.log(result);
          if(!result) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a human with the character ID of ${options.getInteger(id)}`, interaction, client, true);
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 62:57`);
          await m.delete();
        }
      } else if(button.customId === `scp`) {
        button = await promptMessage(interaction, 10, [
          new MessageButton({ customId: `id`, label: `ID`, style: `DANGER` }),
          new MessageButton({ customId: `containment_class`, label: `Containment Class`, style: `PRIMARY` }),
          new MessageButton({ customId: `threat_level`, label: `Threat Level`, style: `SECONDARY` }),
          new MessageButton({ customId: `name`, label: `Name`, style: `SECONDARY` })
        ], `Which information do you want to update?`)
        if(button.customId === `id`) {
          await interaction.editReply({ content: `What is the new ID of the SCP?` });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          if(m.stack) return interaction.editReply({ content: `:x: You took too long to respond.` });
          const result = await client.connection.execute(`update Anomalies set id = "${m.first().content}" where charId = ${options.getInteger(`id`)}`)
          .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
          console.log(result);
          if(!result) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a SCP with the character ID of ${options.getInteger(id)}`, interaction, client, true);
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 80:57`);
          await m.delete();
        } else if(button.customId === `containment_class`) {
          await interaction.editReply({ content: `What is the new containment class of the SCP?` });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          if(m.stack) return interaction.editReply({ content: `:x: You took too long to respond.` });
          const result = await client.connection.execute(`update Anomalies set contaiment_class = "${m.first().content}" where charId = ${options.getInteger(`id`)}`)
          .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
          console.log(result);
          if(!result) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a SCP with the character ID of ${options.getInteger(id)}`, interaction, client, true);
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 80:57`);
          await m.delete();
        } else if(button.customId === `threat_level`) {
          await interaction.editReply({ content: `What is the new threat level of the SCP?` });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          if(m.stack) return interaction.editReply({ content: `:x: You took too long to respond.` });
          const result = await client.connection.execute(`update Anomalies set threat_level = "${m.first().content}" where charId = ${options.getInteger(`id`)}`)
          .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
          console.log(result);
          if(!result) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a SCP with the character ID of ${options.getInteger(id)}`, interaction, client, true);
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 100:57`);
          await m.delete();
        } else if(button.customId === `name`) {
          await interaction.editReply({ content: `What is the new name of the SCP?` });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
          if(m.stack) return interaction.editReply({ content: `:x: You took too long to respond.` });
          const result = await client.connection.execute(`update Anomalies set name = "${m.first().content}" where charId = ${options.getInteger(`id`)}`)
          .catch(e => interactionEmbed(3, `[ERR-SQL]`, `[${e.code}] ${e.message}`, interaction, client, true));
          console.log(result);
          if(!result) return interactionEmbed(3, `[ERR-MISS]`, `I did not find a SCP with the character ID of ${options.getInteger(id)}`, interaction, client, true);
          client.event.emit(`query`, result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 110:57`);
          await m.delete();
        }
      }

      // If no fails occurred, return an OK message
      interactionEmbed(1, `[QUERY-OK] Succesfully updated the entry in the database!`, ``, interaction, client, false);

      cooldown.add(interaction.user.id);
      setTimeout(() => {
        cooldown.delete(interaction.user.id);
      }, 2500);
    }
  }
}