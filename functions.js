const { Client, MessageEmbed, Interaction, Message } = require(`discord.js`);
const fetch = require(`node-fetch`);
const config = require(`./config.json`);

const errors = {
  "[ERR-CLD]": "You are on cooldown!",
  "[ERR-UPRM]": "You do not have the proper permissions to execute this command.",
  "[ERR-BPRM]": "I do not have the proper permissions to execute this command.",
  "[ERR-ARGS]": "You have not supplied the correct parameters. Please check again.",
  "[ERR-UNK]": "I can't tell why an issue spawned. Please report this to a developer.",
  "[WARN-NODM]": "Sorry, but all slash commands only work in a server, not DMs.",
  "[INFO-DEV]": "This command is in development. This should not be expected to work"
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

        interaction.editReply({ content: `My magic has worked and the result has been shown!`});
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

        interaction.editReply({ content: `Oops! I couldn't cast my spell properly` });
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

        interaction.editReply({ content: `Oh no! My magic backfired! Please let my friends in the support server know what happened or try to fix it on your own` });
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

        interaction.editReply({ content: `Heyo, my magic gave me a little message to tell you!` });
        await interaction.followUp({ embeds: [embed], ephemeral: ephemeral })

        break;
    }
  },
  /**
   * @description Replies with a MessageEmbed to the Message
   * @param {Number} type 1- Sucessful, 2- Warning, 3- Error, 4- Information
   * @param {String} content The information to state
   * @param {String} expected The expected argument (If applicable)
   * @param {Message} message The Interaction object for responding
   * @param {Client} client Client object for logging
   * @example messageEmbed(1, `Removed ${removed} roles`, ``, message, client, false)
   * @example messageEmbed(3, `[ERR-UPRM]`, `Missing: \`Manage Messages\``, message, client, true)
   * @returns {null} 
   */
   messageEmbed: async function(type, content, expected, message, client) {
    if(typeof type != 'number') return new SyntaxError(`type is not a number\n> Type: ${type}\n> Content: ${content}`);
    if(type < 1 || type > 4) return new SyntaxError(`type is not a valid integer\n> Type: ${type}\n> Content: ${content}`);
    if(typeof content != 'string') return new SyntaxError(`content is not a string,\n> Type: ${type}\n> Content: ${content}`);
    if(typeof expected != 'string') return new SyntaxError(`expected is not a string\n> Type: ${type}\n> Content: ${content}`);
    if(!message) return new SyntaxError(`message is a required argument\n> Type: ${type}\n> Content: ${content}`);
    if(typeof message != 'object') return new SyntaxError(`message is not an object\n> Type: ${type}\n> Content: ${content}`);
    if(!client) return new SyntaxError(`client is a required argument\n> Type: ${type}\n> Content: ${content}`);
    if(typeof client != 'object') return new SyntaxError(`client is not an object\n> Type: ${type}\n> Content: ${content}`);

    const embed = new MessageEmbed({ author: { name: message.author.id, iconURL: message.author.displayAvatarURL({ dynamic: true,  size: 2048 })}, timestamp: new Date() });

    switch(type) {
      case 1:
        embed
        .setTitle("Success")
        .setColor("BLURPLE")
        .setDescription(errors[content] ?? content)
        .setFooter("The operation was completed successfully with no errors");

        await message.reply({ embeds: [embed] })

        break;
      case 2:
        embed
        .setTitle("Warning")
        .setColor("ORANGE")
        .setFooter("The operation was completed successfully with a minor error")

        await message.reply({ embeds: [embed] })

        break;
      case 3:
        embed
        .setTitle("Error")
        .setColor("RED")
        .setDescription(errors[content] + `\n> ${expected}` ?? `I don't understand the error "${content}" but was expecting ${expected}. Please report this to the support server!`)
        .setFooter("The operation failed to complete due to an error");

        await message.reply({ embeds: [embed] })

        break;
      case 4:
        embed
        .setTitle("Information")
        .setColor("BLURPLE")
        .setDescription(errors[content] ?? content)
        .setFooter("The operation is pending completion");

        await message.reply({ embeds: [embed] })

        break;
    }
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
  }
}