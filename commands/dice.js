// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { interactionEmbed, getRandomNumber } = require("../functions");
const cooldown = new Set();

module.exports = {
  name: "dice",
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Rolls a dice of your choosing")
    .addIntegerOption(option => {
      return option
        .setName("sides")
        .setDescription("The number of sides on the dice")
        .setRequired(true);
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
      const sides = options.getInteger("sides");
      let diceRoll = await getRandomNumber(1, 1, sides, false);
      interaction.editReply({ content: `Your dice landed on ${diceRoll[0]}` });

      cooldown.add(interaction.user.id);
      setTimeout(() => {
        cooldown.delete(interaction.user.id);
      }, 2500);
    }
  }
};