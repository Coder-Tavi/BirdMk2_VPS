const { Client, CommandInteraction, CommandInteractionOptionResolver } = require(`discord.js`);
const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { interactionEmbed, getRandomNumber } = require("../functions");
const cooldown = new Set();

module.exports = {
  name: `coinflip`,
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
      const flip = await getRandomNumber(1, 1, 2, false)
      interaction.editReply({ content: `Your coin has landed. It's ${flip[0] === 1 ? `heads` : `tails`}!`});

      cooldown.add(interaction.message.author.id);
      setTimeout(() => {
        cooldown.delete(interaction.message.author.id);
      }, 2500);
    }
  }
}