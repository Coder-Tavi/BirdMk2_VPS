const { Client, CommandInteraction, CommandInteractionOptionResolver, Message } = require(`discord.js`);
const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { interactionEmbed, getRandomNumber, messageEmbed } = require("../functions");
const cooldown = new Set();

module.exports = {
  name: `dice`,
  description: `Rolls a dice of your choosing`,
  usage: `dice <sides>`,
  data: new SlashCommandBuilder()
  .setName(`dice`)
  .setDescription(`Rolls a dice of your choosing`)
  .addIntegerOption(option => {
    return option
    .setName(`sides`)
    .setDescription(`The number of sides on the dice`)
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
      const sides = options.getInteger(`sides`);
      let diceRoll = await getRandomNumber(1, 1, sides, false)
      interaction.editReply({ content: `Your dice landed on ${diceRoll[0]}` });

      cooldown.add(interaction.user.id);
      setTimeout(() => {
        cooldown.delete(interaction.user.id);
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
      const sides = parseInt(args[0]);
      if(!sides || sides === `NaN`) return messageEmbed(3, `[ERR-ARG]`, `Arg: sides :-: Expected integer, got undefined/NaN`, message, client);
      let diceRoll = await getRandomNumber(1, 1, sides, false);
      message.reply({ content: `Your dice landed on ${diceRoll[0]}` });

      cooldown.add(message.author.id);
      setTimeout(() => {
        cooldown.delete(message.author.id);
      }, 2500);
    }
  }
}