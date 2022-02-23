const { SlashCommandBuilder } = require("@discordjs/builders");
// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, MessageButton } = require("discord.js");
const { interactionEmbed, awaitButtons } = require("../functions.js");
const config = require("../config.json");

module.exports = {
  name: "ticket",
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Commands for managing tickets")
    .addSubcommand(subcommand => {
      return subcommand
        .setName("create")
        .setDescription("Create a new ticket")
        .addStringOption(option => {
          return option
            .setName("reason")
            .setDescription("The reason for creating the ticket")
            .setRequired(false);
        });
    })
    .addSubcommand(subcommand => {
      return subcommand
        .setName("claim")
        .setDescription("Claims a ticket, marking you as the staff member to handle it")
        .addUserOption(option => {
          return option
            .setName("user")
            .setDescription("The user whose ticket you wish to claim")
            .setRequired(false);
        });
    })
    .addSubcommand(subcommand => {
      return subcommand
        .setName("unclaim")
        .setDescription("Unclaims a ticket, unmarking you as the staff member to handle it")
        .addUserOption(option => {
          return option
            .setName("user")
            .setDescription("The user whose ticket you wish to unclaim")
            .setRequired(false);
        });
    })
    .addSubcommand(subcommand => {
      return subcommand
        .setName("close")
        .setDescription("Closes a ticket, cleaning the channel and exporting all messages")
        .addStringOption(option => {
          return option
            .setName("reason")
            .setDescription("Reason for closing the ticket")
            .setRequired(true);
        });
    }),
  /**
   * @param {Client} client 
   * @param {CommandInteraction} interaction 
   * @param {CommandInteractionOptionResolver} options 
   */
  run: async (client, interaction, options) => {
    await interaction.guild.channels.fetch();
    const subcommand = options.getSubcommand();
    const ticket = !options.getUser("user") ? interaction.channel : interaction.guild.channels.cache.find(c => c.name === `ticket-${options.getUser("user").id}`);
    if(subcommand != "create" && !ticket.name.startsWith("ticket-")) return interactionEmbed(3, "[ERR-MISS]", "I did not find a valid ticket to modify", interaction, client, false);

    if(subcommand === "create") {
      if(interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`)) return interactionEmbed(3, "[ERR-CLD]", "You already have a ticket open", interaction, client, true);

      // Set up overwrites
      const moderators = config.discord["ticketManagers"].concat(config.discord["modRoles"]);
      const overwrites = [];
      for(const role of moderators) {
        overwrites.push({
          id: role,
          allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "READ_MESSAGE_HISTORY",  "USE_EXTERNAL_EMOJIS", "USE_EXTERNAL_STICKERS"]
        });
      }
      overwrites.push({
        id: interaction.user.id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "USE_EXTERNAL_STICKERS"]
      },
      {
        id: interaction.guild.roles.everyone.id,
        deny: ["VIEW_CHANNEL"]
      });

      // Create the channel
      const ticket = await interaction.guild.channels.create(`ticket-${interaction.user.id}`, {
        type: "GUILD_TEXT",
        topic: "Staff member handling this ticket: None",
        parent: interaction.guild.channels.cache.get("943594383343759410"),
        permissionOverwrites: overwrites
      });

      ticket.send({ content: `Hi ${interaction.member}. Thank you for opening a ticket. Staff will respond as soon as they are able to.\n> The reason you opened this ticket was for: \`${options.getString("reason") ?? "No response specified"}\`.\n\n*If you do not need help anymore, please run \`/ticket close\` and I will close the ticket for you*` });
      interactionEmbed(1, "Successfully opened a ticket", "", interaction, client, false);
    } else if(subcommand === "claim") {
      if(!interaction.member.roles.cache.find(r => config.discord["ticketManagers"].includes(r.id)) && ticket.topic.split("<@!")[1].replace(">", "") != interaction.user.id) return interactionEmbed(3, "[ERR-UPRM]", "You are not authorized to manage the selected ticket", interaction, client, true);
      // Check if the ticket is truly a ticket and not another channel
      if(!ticket.name.startsWith("ticket-")) return interactionEmbed(3, "[ERR-ARGS]", "Arg: user :-: Expected open ticket with user, got undefined or invalid channel");
      if(ticket.topic != "Staff member handling this ticket: None" && !interaction.member.roles.cache.some(r => config.discord["ticketManagers"].includes(r.id))) return interactionEmbed(3, "[ERR-UPRM]", "You do not have permission to override the claim", interaction, client, true);

      // Overwrites
      const overwrites = [];
      for(const role of config.discord["ticketManagers"]) {
        overwrites.push({
          id: role,
          allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "READ_MESSAGE_HISTORY",  "USE_EXTERNAL_EMOJIS", "USE_EXTERNAL_STICKERS", "MANAGE_MESSAGES"]
        });
      }
      overwrites.push({
        id: interaction.user.id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "USE_EXTERNAL_STICKERS", "MANAGE_MESSAGES"]
      },
      {
        id: ticket.name.split("-")[1],
        allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS"]
      },
      {
        id: interaction.guild.roles.everyone.id,
        deny: ["VIEW_CHANNEL"]
      });

      // Finish claiming
      await ticket.edit({ topic: `Staff member handling this ticket: <@!${interaction.user.id}>`, permissionOverwrites: overwrites });
      interactionEmbed(1, "Successfully claimed the ticket", "", interaction, client, true);
    } else if(subcommand === "unclaim") {
      if(!interaction.member.roles.cache.find(r => config.discord["ticketManagers"].includes(r.id)) && ticket.topic.split("<@!")[1].replace(">", "") != interaction.user.id) return interactionEmbed(3, "[ERR-UPRM]", "You are not authorized to manage the selected ticket", interaction, client, true);
      // Check if the ticket is truly a ticket and not another channel
      if(!ticket.name.startsWith("ticket-")) return interactionEmbed(3, "[ERR-ARGS]", "Arg: user :-: Expected open ticket with user, got undefined or invalid channel");
      if(ticket.topic === "Staff member handling this ticket: None") return interactionEmbed(3, "[ERR-ARGS]", "Arg: user :-: Expected claimed ticket, got unclaimed ticket", interaction, client, true);
      if(ticket.topic != "Staff member handling this ticket: None" && !interaction.member.roles.cache.some(r => config.discord["ticketManagers"].includes(r.id))) return interactionEmbed(3, "[ERR-UPRM]", "You do not have permission to override the claim", interaction, client, true);

      // Overwrites
      const moderators = config.discord["ticketManagers"].concat(config.discord["modRoles"]);
      const overwrites = [];
      for(const role of moderators) {
        overwrites.push({
          id: role,
          allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "READ_MESSAGE_HISTORY",  "USE_EXTERNAL_EMOJIS", "USE_EXTERNAL_STICKERS"]
        });
      }
      overwrites.push({
        id: ticket.name.split("-")[1],
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "USE_EXTERNAL_STICKERS"]
      },
      {
        id: interaction.guild.roles.everyone.id,
        deny: ["VIEW_CHANNEL"]
      });

      // Finish unclaiming
      await ticket.edit({ topic: "Staff member handling this ticket: None", permissionOverwrites: overwrites });
      interactionEmbed(1, "Successfully unclaimed the ticket", "", interaction, client, true);
    } else if(subcommand === "close") {
      // If the user is not a ticket manager OR they have not claimed the ticket, reject the command
      if(!interaction.member.roles.cache.find(r => config.discord["ticketManagers"].includes(r.id)) && ticket.topic.split("<@!")[1].replace(">", "") != interaction.user.id && ticket.name.split("-")[1] != interaction.user.id) return interactionEmbed(3, "[ERR-UPRM]", "You are not authorized to manage the selected ticket", interaction, client, true);
      // Check if the ticket is truly a ticket and not another channel
      if(!ticket.name.startsWith("ticket-")) return interactionEmbed(3, "[ERR-ARGS]", "Arg: user :-: Expected open ticket with user, got undefined or invalid channel");

      const confirmation = await awaitButtons(interaction, 15, [new MessageButton({ style: "DANGER", label: "Yes, I want to close this ticket", customId: "yes" }), new MessageButton({ style: "SUCCESS", label: "No, I do not want to close this ticket", customId: "no" })], "Are you sure you want to close this ticket?", true);
      if(confirmation.customId === "yes") {
        await ticket.delete();
        client.channels.cache.get(config.discord["errorChannel"]).send(`**[TICKET]** <@!${interaction.user.id}> closed a ticket by <@!${ticket.name.split("-")[1]}> for ${options.getString("reason")}`);
      } else {
        interaction.editReply({ content: ":lock: Cancelled closing the ticket" });
      }
    }
  }
};