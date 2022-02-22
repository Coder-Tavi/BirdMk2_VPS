// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, MessageButton, MessageSelectMenu, MessageActionRow } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { interactionEmbed, awaitButtons, departments, awaitMenu } = require("../functions.js");
const cooldown = new Set();

module.exports = {
  name: "update",
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Updates a character's information")
    .addIntegerOption(option => {
      return option
        .setName("id")
        .setDescription("The ID of the character to update")
        .setRequired(true);
    }),
  /**
   * @param {Client} client 
   * @param {CommandInteraction} interaction 
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    if(cooldown.has(interaction.member.id)) {
      return interactionEmbed(3, "[ERR-CLD]", "You must not have an active cooldown", interaction, client, true);
    } else {
      // If the user lacks permissions, return an error
      if(!interaction.member.permissions.has("MANAGE_ROLES")) return interactionEmbed(3, "[ERR-UPRM]", "Missing: `Manage Roles`", interaction, client, true);

      let button = await awaitButtons(interaction, 10, [new MessageButton({ customId: "human", label: "Human", style: "SUCCESS" }), new MessageButton({ customId: "scp", label: "SCP", style: "DANGER" })], "Which type of character do you want to update?", false);
      const filter = m => m.author.id === interaction.user.id;

      if(button.customId === "human") {
        button = await awaitButtons(interaction, 10, [
          new MessageButton({ customId: "name", label: "Name", style: "PRIMARY" }),
          new MessageButton({ customId: "clearance", label: "Clearance", style: "DANGER" }),
          new MessageButton({ customId: "age", label: "Age", style: "SECONDARY" }),
          new MessageButton({ customId: "gender", label: "Gender", style: "SECONDARY" })
        ], "Which information do you want to update?", true);
        if(button.customId === "name") {
          await interaction.editReply({ content: "What is the new name of the character?" });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
          if(m.stack) return interaction.editReply({ content: ":x: You took too long to respond." });
          const result = await client.connection.execute(`update Humans set name = "${m.first().content}" where charId = ${options.getInteger("id")}`)
            .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
          if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a human with the character ID of ${options.getInteger("id")}`, interaction, client, true);
          client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 42:57`);
          await m.delete();
        } else if(button.customId === "age") {
          await interaction.editReply({ content: "What is the new age of the character?" });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
          if(m.stack) return interaction.editReply({ content: ":x: You took too long to respond." });
          const result = await client.connection.execute(`update Humans set age = ${m.first().content} where charId = ${options.getInteger("id")}`)
            .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
          if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a human with the character ID of ${options.getInteger("id")}`, interaction, client, true);
          client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 52:57`);
          await m.delete();
        } else if(button.customId === "gender") {
          await interaction.editReply({ content: "What is the new gender of the character?" });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
          if(m.stack) return interaction.editReply({ content: ":x: You took too long to respond." });
          const result = await client.connection.execute(`update Humans set gender = "${m.first().content}" where charId = ${options.getInteger("id")}`)
            .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
          if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a human with the character ID of ${options.getInteger("id")}`, interaction, client, true);
          client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 62:57`);
          await m.delete();
        } else if(button.customId === "clearance") {
          // Step 1: Preliminary
          const department = await awaitMenu(interaction, 15, [1, 1], [
            { value: "AD", label: "Administrative Department" },
            { value: "ETS", label: "Engineering and Technical Services" },
            { value: "EC", label: "Ethics Committee" },
            { value: "JS", label: "Janitorial Staff" },
            { value: "IA", label: "Intelligence Agency" },
            { value: "MTF", label: "Mobile Task Force" },
            { value: "SD", label: "Security Department" },
            { value: "ScD", label: "Science Department" },
            { value: "CI", label: "Other", description: "Chaos Insurgency counts as this" }
          ], "What is the new department of the character?", true);
          const clearance = await awaitMenu(interaction, 15, [1, 1], [
            { value: "N/A", label: "None", description: "This counts for characters that don't have a clearance level" },
            { value: "CL-0", label: "Clearance Level 0" },
            { value: "CL-1", label: "Clearance Level 1" },
            { value: "CL-2", label: "Clearance Level 2" },
            { value: "CL-3", label: "Clearance Level 3" },
            { value: "CL-4", label: "Clearance Level 4" },
            { value: "CL-5", label: "Clearance Level 5" }
          ], "What is the new clearance of the character?", true);

          // Step 2: Logic
          if(!departments[department.values[0]][clearance.values[0]]) return interactionEmbed(3, "[ERR-MISS]", `I did not find a department with the ID of ${department.values[0]} and a clearance of ${clearance.values[0]}`, interaction, client, true);

          // Step 3: Confirmation
          const confirm = await awaitButtons(interaction, 15, [
            new MessageButton({ customId: "yes", label: "Yes", style: "PRIMARY" }),
            new MessageButton({ customId: "no", label: "No", style: "DANGER" })
          ], `Are you sure you want to set the department to ${department.values[0]} and the clearance to ${clearance.values[0]}?`, true);

          // Step 4: Execution
          if(confirm.customId === "yes") {
            const result = await client.connection.execute(`update Humans set department = "${department.values[0]}", clearance = "${clearance.values[0]}" where charId = ${options.getInteger("id")}`)
              .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
            if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a human with the character ID of ${options.getInteger("id")}`, interaction, client, true);
            client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 100:59`);
          } else {
            return interactionEmbed(1, "[CMD-OK] Cancelled the command", "", interaction, client, false);
          }
        }
      } else if(button.customId === "scp") {
        button = await awaitButtons(interaction, 10, [
          new MessageButton({ customId: "id", label: "ID", style: "DANGER" }),
          new MessageButton({ customId: "containment_class", label: "Containment Class", style: "PRIMARY" }),
          new MessageButton({ customId: "threat_level", label: "Threat Level", style: "SECONDARY" }),
          new MessageButton({ customId: "name", label: "Name", style: "SECONDARY" })
        ], "Which information do you want to update?");
        if(button.customId === "id") {
          await interaction.editReply({ content: "What is the new ID of the SCP?" });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
          if(m.stack) return interaction.editReply({ content: ":x: You took too long to respond." });
          const result = await client.connection.execute(`update Anomalies set id = "${m.first().content}" where charId = ${options.getInteger("id")}`)
            .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
          if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a SCP with the character ID of ${options.getInteger("id")}`, interaction, client, true);
          client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 122:57`);
          await m.delete();
        } else if(button.customId === "containment_class") {
          await interaction.editReply({ content: "What is the new containment class of the SCP?" });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
          if(m.stack) return interaction.editReply({ content: ":x: You took too long to respond." });
          const result = await client.connection.execute(`update Anomalies set contaiment_class = "${m.first().content}" where charId = ${options.getInteger("id")}`)
            .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
          if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a SCP with the character ID of ${options.getInteger("id")}`, interaction, client, true);
          client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 132:57`);
          await m.delete();
        } else if(button.customId === "threat_level") {
          await interaction.editReply({ content: "What is the new threat level of the SCP?" });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
          if(m.stack) return interaction.editReply({ content: ":x: You took too long to respond." });
          const result = await client.connection.execute(`update Anomalies set threat_level = "${m.first().content}" where charId = ${options.getInteger("id")}`)
            .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
          if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a SCP with the character ID of ${options.getInteger("id")}`, interaction, client, true);
          client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 142:57`);
          await m.delete();
        } else if(button.customId === "name") {
          await interaction.editReply({ content: "What is the new name of the SCP?" });
          const m = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
          if(m.stack) return interaction.editReply({ content: ":x: You took too long to respond." });
          const result = await client.connection.execute(`update Anomalies set name = "${m.first().content}" where charId = ${options.getInteger("id")}`)
            .catch(e => interactionEmbed(3, "[ERR-SQL]", `[${e.code}] ${e.message}`, interaction, client, true));
          if(!result) return interactionEmbed(3, "[ERR-MISS]", `I did not find a SCP with the character ID of ${options.getInteger("id")}`, interaction, client, true);
          client.event.emit("query", result[0], `${__filename.split("/")[__filename.split("/").length - 1]} 152:57`);
          await m.delete();
        }
      }

      // If no fails occurred, return an OK message
      interactionEmbed(1, "[QUERY-OK] Succesfully updated the entry in the database!", "", interaction, client, false);

      cooldown.add(interaction.user.id);
      setTimeout(() => {
        cooldown.delete(interaction.user.id);
      }, 2500);
    }
  }
};