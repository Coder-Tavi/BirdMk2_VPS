const { Client, CommandInteraction, CommandInteractionOptionResolver, Message } = require(`discord.js`);
const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { interactionEmbed, getRandomNumber, messageEmbed } = require("../functions");
const cooldown = new Set();

module.exports = {
  name: `coinflip`,
  description: `Flips a coin`,
  usage: `coinflip`,
  data: new SlashCommandBuilder()
  .setName(`coinflip`)
  .setDescription(`Flips a coin`),
  /**
   * @param {Client} client 
   * @param {CommandInteraction} interaction 
   * @param {CommandInteractionOptionResolver} options 
   */
  run: async (client, interaction, options) => {
    if(cooldown.has(interaction.user.id)) {
      return interactionEmbed(3, `[ERR-CLD]`, `You must not have an active cooldown`, interaction, client, true);
    } else {
      let flip = getRandomNumber(1, 1, 2, false)
      interaction.editReply({ content: `Your coin has landed. It's ${flip === 1 ? `heads` : `tails`}!`});

      cooldown.add(interaction.message.author.id);
      setTimeout(() => {
        cooldown.delete(interaction.message.author.id);
      }, 2500);
    }
  },
  /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */
  execute: async (client, message, args) => {
    if(cooldown.has(message.author.id)) {
      return messageEmbed(3, `[ERR-CLD]`, `You must not have an active cooldown`, message, client);
    } else {
      let flip = getRandomNumber(1, 1, 2, false);
      message.reply({ content: `Your coin has landed. It's ${flip === 1 ? `heads` : `tails`}!`});

      cooldown.add(message.author.id);
      setTimeout(() => {
        cooldown.delete(message.author.id);
      }, 2500);
    }
  }
}