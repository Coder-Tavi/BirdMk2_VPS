const { Client, MessageEmbed, Interaction, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } = require(`discord.js`);
const fetch = require(`node-fetch`);
const config = require(`./config.json`);

const errors = {
  "[SQL-ERR]": `An error has occurred while trying to execute a MySQL query`,
  "[ERR-CLD]": `You are on cooldown!`,
  "[ERR-UPRM]": `You do not have the proper permissions to execute this command`,
  "[ERR-BPRM]": `I do not have the proper permissions to execute this command`,
  "[ERR-ARGS]": `You have not supplied the correct parameters. Please check again`,
  "[ERR-UNK]": `I can't tell why an issue spawned. Please report this to a developer`,
  "[ERR-MISS]": `I cannot find the information in the system`,
  "[WARN-NODM]": `Sorry, but all slash commands only work in a server, not DMs`,
  "[WARN-CMD]": `The requested slash command was not found`,
  "[INFO-DEV]": `This command is in development. This should not be expected to work`
}

module.exports = {
  /**
   * @description Sends a message to the console
   * @param {String} message [REQUIRED] The message to send to the console
   * @param {String} source [REQUIRED] Source of the message
   * @param {Client} client [REQUIRED] A logged-in Client to send the message
   * @returns {null} null
   * @example toConsole(`Hello, World!`, `functions.js 12:15`, client);
   * @example toConsole(`Published a ban`, `ban.js 14:35`, client);
   */
  toConsole: async (message, source, client) => {
    if(!message) return new SyntaxError(`message is undefined`);
    if(!source) return new SyntaxError(`source is undefined`);
    if(!client) return new SyntaxError(`client is undefined`);

    client.channels.cache.get(config.errorChannel).send(`Incoming message from ${source}`);
    
    client.channels.cache.get(config.errorChannel).send({ embeds: [
      new MessageEmbed({
        title: `Message to Console`,
        color: `RED`,
        description: `${message}`,
        footer: {
          text: `Source: ${source}`
        },
        timestamp: new Date()
      })
    ]});

    return null;
  },
  /**
   * @description Replies with a MessageEmbed to the Interaction
   * @param {Number} type 1- Sucessful, 2- Warning, 3- Error, 4- Information
   * @param {String} content The information to state
   * @param {String} expected The expected argument (If applicable)
   * @param {Interaction} interaction The Interaction object for responding
   * @param {Client} client Client object for logging
   * @param {Boolean} ephemeral Whether or not to ephemeral the message
   * @example interactionEmbed(1, `Removed ${removed} roles`, ``, interaction, client, false)
   * @example interactionEmbed(3, `[ERR-UPRM]`, `Missing: \`Manage Messages\``, interaction, client, true)
   * @returns {null} 
   */
   interactionEmbed: async function(type, content, expected, interaction, client, ephemeral) {
    if(typeof type != 'number') return new SyntaxError(`type is not a number\n> Type: ${type}\n> Content: ${content}`);
    if(type < 1 || type > 4) return new SyntaxError(`type is not a valid integer\n> Type: ${type}\n> Content: ${content}`);
    if(typeof content != 'string') return new SyntaxError(`content is not a string,\n> Type: ${type}\n> Content: ${content}`);
    if(typeof expected != 'string') return new SyntaxError(`expected is not a string\n> Type: ${type}\n> Content: ${content}`);
    if(!interaction) return new SyntaxError(`interaction is a required argument\n> Type: ${type}\n> Content: ${content}`);
    if(typeof interaction != 'object') return new SyntaxError(`interaction is not an object\n> Type: ${type}\n> Content: ${content}`);
    if(!client) return new SyntaxError(`client is a required argument\n> Type: ${type}\n> Content: ${content}`);
    if(typeof client != 'object') return new SyntaxError(`client is not an object\n> Type: ${type}\n> Content: ${content}`);
    if(typeof ephemeral != 'boolean') return new SyntaxError(`ephemeral is a required argument\n> Type: ${type}\n> Content: ${content}`);
    if(typeof ephemeral != 'boolean') return new SyntaxError(`ephemeral is not an object\n> Type: ${type}\n> Content: ${content}`);

    const embed = new MessageEmbed();

    switch(type) {
      case 1:
        embed
        .setTitle("Success")
        .setAuthor(interaction.user.username, interaction.user.avatarURL({ dynamic: true, size: 4096 }))
        .setColor("BLURPLE")
        .setDescription(errors[content] ?? content)
        .setFooter("The operation was completed successfully with no errors")
        .setTimestamp();

        await interaction.editReply({ content: `\:unlock: [CMD-OK]`});
        await interaction.followUp({ embeds: [embed], ephemeral: ephemeral })

        break;
      case 2:
        embed
        .setTitle("Warning")
        .setAuthor(interaction.user.username, interaction.user.avatarURL({ dynamic: true, size: 4096 }))
        .setColor("ORANGE")
        .setDescription(errors[content] + `\n> ${expected}` ?? content)
        .setFooter("The operation was completed successfully with a minor error")
        .setTimestamp();

        await interaction.editReply({ content: `\:closed_lock_with_key: [CMD-WARN]` });
        await interaction.followUp({ embeds: [embed], ephemeral: ephemeral })

        break;
      case 3:
        embed
        .setTitle("Error")
        .setAuthor(interaction.user.username, interaction.user.avatarURL({ dynamic: true, size: 4096 }))
        .setColor("RED")
        .setDescription(errors[content] + `\n> ${expected}` ?? `I don't understand the error "${content}" but was expecting ${expected}. Please report this to the support server!`)
        .setFooter("The operation failed to complete due to an error")
        .setTimestamp();

        await interaction.editReply({ content: `\:lock: [CMD-ERROR]` });
        await interaction.followUp({ embeds: [embed], ephemeral: ephemeral })

        break;
      case 4:
        embed
        .setTitle("Information")
        .setAuthor(interaction.user.username, interaction.user.avatarURL({ dynamic: true, size: 4096 }))
        .setColor("BLURPLE")
        .setDescription(errors[content] ?? content)
        .setFooter("The operation is pending completion")
        .setTimestamp();

        await interaction.editReply({ content: `\:lock_with_ink_pen: [CMD-INFO]` });
        await interaction.followUp({ embeds: [embed], ephemeral: ephemeral })

        break;
    }
  },
  /**
     * Sends buttons to a user and awaits the response
     * @param {Interaction} interaction Interaction object
     * @param {Number} time Seconds for which the buttons are valid
     * @param {Array<MessageButton>} buttons The buttons to place on the message
     * @param {String|null} content The content to display, can be blank
     * @param {Boolean} remove Delete the message after the time expires
     * @example awaitButtons(interaction, 15, [button1, button2], `Select a button`, true);
     * @returns {MessageButton|null} The button the user clicked or null if no button was clicked
     */
   awaitButtons: async function (interaction, time, buttons, content, remove) {
    if(!interaction || !time || !buttons || remove === null) return new SyntaxError(`One of the following values is not fulfilled:\n> interaction: ${interaction}\n> time: ${time}\n> buttons: ${buttons}\n> remove: ${remove}`);
    content = content ?? `Please select an option`;
    
    // Create a filter
    const filter = i => {
      i.deferUpdate();
      return i.user.id === interaction.user.id;
    };
    // Convert the time to milliseconds
    time *= 1000;
    // Create a MessageActionRow and add the buttons
    const row = new MessageActionRow();
    row.addComponents(buttons);
    // Send a follow-up message with the buttons and await a response
    const message = await interaction.followUp({ content: content, components: [row] })
    const res = await message
    .awaitMessageComponent({ filter, componentType: `BUTTON`, time: time, errors: ['time'] })
    .catch(() => { return null; });
    // Disable the buttons on row
    for(button of row.components) {
      button.setDisabled(true);
    }
    // Send the disabled row
    await message.edit({ content: res === null ? `\:lock: Cancelled` : content, components: [row] });
    setTimeout(() => {
      // Delete if it's not already deleted
      // And we're allowed to delete it
      // And the message is not null
      if(!message.deleted && remove && res != null) message.delete();
    }, 5000);
    // Return the button (Or null if no response was given)
    return res;
  },
  /**
   * Send a MessageSelectMenu to a user and awaits the response
   * @param {Interaction} interaction Interaction object
   * @param {Number} time Seconds for which the menu is valid
   * @param {Number[]} values [min, max] The amount of values that can be selected
   * @param {MessageSelectOptionData|MessageSelectOptionData[]} options The options for the menu
   * @param {String|null} content The content to display, can be blank
   * @param {Boolean} remove Delete the message after the time expires
   * @example awaitMenu(interaction, 15, [menu], `Select an option`, true);
   * @returns {SelectMenuInteraction|null} The menu the user interacted with or null if nothing was selected
   */
  awaitMenu: async function (interaction, time, values, options, content, remove) {
    // Step 0: Checks
    if(!interaction || !time || !values || !options || remove === null) return new SyntaxError(`One of the following values is not fulfilled:\n> interaction: ${interaction}\n> time: ${time}\n> values: ${values}\n> options: ${options}\n> remove: ${remove}`);
    content = content ?? `Please select an option`;

    // Step 1: Setup
    const filter = i => {
      i.deferUpdate();
      return i.user.id === interaction.user.id;
    };
    time *= 1000;

    // Step 2: Creation
    const row = new MessageActionRow();
    const menu = new MessageSelectMenu({
      minValues: values[0],
      maxValues: values[1],
      customId: `await-menu`
    });
    menu.addOptions(options);
    row.addComponents(menu);

    // Step 3: Execution
    const message = await interaction.followUp({ content: content, components: [row] })
    const res = await message
    .awaitMessageComponent({ filter, componentType: `SELECT_MENU`, time: time, errors: ['time'] })
    .catch(() => { return null; });

    // Step 4: Processing
    row.components[0].setDisabled(true);
    await message.edit({ content: res === null ? `\:lock: Cancelled` : content, components: [row] });

    // Step 5: Cleanup
    setTimeout(() => {
      if(!message.deleted && remove && res != null) message.delete();
    }, 1500);
    return res;
  },
  /**
   * @description Generates a random number between min and max using the random.org API
   * @param {Number} n How many numbers you want
   * @param {Number} min The minimum number
   * @param {Number} max The maximum number
   * @param {Boolean} duplicates Should duplicates appear?
   * @returns {Array<Number>} Array of numbers
   * @example getRandomNumber(1, 0, 100, false)
   */
  getRandomNumber: async function(n, min, max, duplicates) {
    const apiKeys = config.apiKeys;
    let array;
    
    for(let key of apiKeys) {
      const payload = {
        "jsonrpc": "2.0",
        "method": "generateIntegers",
        "params": {
          "apiKey": key,
          "n": n,
          "min": min,
          "max": max,
          "replacement": duplicates,
        },
        "id": 1234567890
      };

      const res = await fetch("https://api.random.org/json-rpc/2/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if(!json.error) {array = json.result.random.data; break;}
    }
    return array;
  },
  /**
   * JSON containing a list of departments and their respective ranks
   */
  departments: {
    "AD": {
      "CL-1": "Administrative Intern",
      "CL-2": "Administrative Assistant",
      "CL-4A": "Assistant Site Director",
      "CL-5": "Site Director",
    },
    "SD": {
      "CL-1": "Security Trainee",
      "CL-2": "Security Sergeant",
      "CL-3A": "Security Lieutenant",
      "CL-4A": "Assistant Security Director",
      "CL-5": "Security Director",
    },
    "ScD": {
      "CL-1": "Junior Researcher",
      "CL-2": "Researcher",
      "CL-3A": "Senior Researcher",
      "CL-4A": "Assistant Research Director",
      "CL-5": "Research Director",
    },
    "MTF": {
      "CL-1": "Task Force Trainee",
      "CL-2": "Task Force Operative",
      "CL-3A": "Task Force Sergeant",
      "CL-3B": "Task Force Lieutenant",
      "CL-4A": "Task Force Captain",
      "CL-5": "Director of Task Forces",
    },
    "MD": {
      "CL-1": "Nurse",
      "CL-2": "Medical Practitioner",
      "CL-3A": "Senior Practitioner",
      "CL-4A": "Assistant Medical Director",
      "CL-4B": "Medical Director"
    },
    "ETS": {
      "CL-1": "Junior Engineer",
      "CL-2": "Engineer",
      "CL-3A": "Senior Engineer",
      "CL-4A": "Assistant Engineering Director",
      "CL-5": "Engineering Director"
    },
    "EC": {
      "CL-1": "Junior Committee Member",
      "CL-2": "Committee Member",
      "CL-3A": "Senior Committee Member",
      "CL-4A": "Assistant Committee Liason",
      "CL-5": "Committee Liason"
    },
    "IA": {
      "CL-1": "Trainee Agent",
      "CL-2": "Field Agent",
      "CL-3A": "Senior Field Agent",
      "CL-4A": "Deputy Regional Intelligence Director",
      "CL-5": "Regional Intelligence Director",
    },
    "JS": {
      "CL-1": "Janitor"
    },
    "CI": {
      "N/A": "N/A"
    }
  }
}