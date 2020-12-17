// Import winston Logging Library
const winston = require("winston");

// Import Discord.JS Library
import * as discord from "discord.js";
import { Client, Message, TextChannel } from "discord.js";
import * as http from "http";
import path = require("path");
import {
  EchobotConfiguration,
  EchobotOptions,
  EchobotRedirect,
  WebhookId,
} from "./models";
import { logger } from "./logger";
import { loadConfiguration } from "./config";
import fetch from "node-fetch";


import { getUrls } from "./utils";
import * as isImageUrl from "is-image-url";
// Constants
const imageExts = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "tif",
  "tiff",
  "bmp",
  "svg",
  "jif",
  "jfif",
  "apng",
];

function main(): void {
  // Load the configuration file.
  var configs: EchobotConfiguration[];
  try {
     configs= loadConfiguration("config.json");
  } catch (error) {
    logger.error(error)
    return;
  }
  configs.forEach(config => {
    
    new EchoBot(config);
  });
}


class EchoBot {

  // Create global configuration variable.
  config: EchobotConfiguration = null;

  // Create global discord client variable.
  discordClient: Client = null;
  constructor(config: EchobotConfiguration) {
    this.config = config;
    
    this.loginToDiscord();
  }
  /**
   * Signs into the Discord client with the token in the config,
   * and subscribes to message listeners.
   */
  loginToDiscord(): void {

    // Create client, but don't login yet.
    this.discordClient = new discord.Client();
    (<any>this.discordClient).config = this.config
    // Register event for when client is ready.
    this.discordClient.on("ready", () => {
      logger["info"]("Signed into Discord.");
    });

    // Register event for when client receives a message.
    this.discordClient.on("message", this.onDiscordClientMessageReceived);

    // Register event for when an error occurs.
    this.discordClient.on("error", (error) => {
      logger["error"]("An error occurred: " + error.message);
      logger["info"]("Restarting Discord Client.");
      this.loginToDiscord();
    });

    // Login.
    this.discordClient.login(this.config.token).catch((err) => {
      logger["error"]("Could not sign into Discord: " + err);
    });
  }
  /**
  * Fired when a message is received on Discord in any channel.
  * @param message The message that was received.
  */
  onDiscordClientMessageReceived(message: Message): void {
    // Find redirects that have this message's channel id as a source.
    let matchingRedirects = this.config.redirects.filter((redirect) =>
      redirect.sources.some((source) => source == message.channel.id)
    );

    // logger["info"]("Reached Here")
    let matchingRedirectsFiltered = this.config.filteredRedirects
      .filter(
        (filteredRedirects) =>
          filteredRedirects.redirect.sources.some(
            (source) => source == message.channel.id
          ) &&
          filteredRedirects.words.some((word) => {
            if (filteredRedirects.ignoreQuote)
              var regexMatcher = new RegExp(
                `${word.toLowerCase()}(?=[^"]*(?:"[^"]*"[^"]*)*$)`
              );
            else var regexMatcher = new RegExp(`${word.toLowerCase()}`);
            // console.log(message.content.toLowerCase().match(regexMatcher)?.length>0);
            return message.content.toLowerCase().match(regexMatcher)?.length > 0;
          })
      )
      .map((echobotFilter) => echobotFilter.redirect);
    redirect(message, matchingRedirects);
    redirect(message, matchingRedirectsFiltered);
  }
}


async function redirect(
  message: Message,
  matchingRedirects: EchobotRedirect[]
): Promise<void> {
  // Redirect to each destination.
  matchingRedirects.forEach((redirect) => {
    redirect.destinations.forEach(async (destination) => {
      // Relay message.
      logger["info"](
        "Redirecting message by " +
        message.author.username +
        " from " +
        message.guild.name +
        "/" +
        (message.channel as TextChannel).name +
        " to " +
        destination.id

      );
      await sendMessage(message, destination, redirect.options);
    });
  });
}

async function sendMessage(
  message: Message,
  destChannel: WebhookId,
  options: EchobotOptions
): Promise<void> {

  let messageContents = message.content;
  // Copy rich embed if requested.
  if (options && options.copyRichEmbed) {
    message.embeds.forEach((value) => {
      if (value.type == "rich") {
        messageContents = value.description;
      }
    });
  }

  let image = getImageLink(messageContents, options.accurateImage);

  // Remove @everyone if requested.
  if (options && options.removeEveryone)
    messageContents = messageContents.replace("@everyone", "@-everyone");

  // Remove @here if requested.
  if (options && options.removeHere)
    messageContents = messageContents.replace("@here", "@-here");

  // Determine if we are sending a rich embed or not. (This is decided by if a color is set).
  if (options) {
    // Sending a rich embed.
    let richEmbed = new discord.RichEmbed({
      color: options.richEmbedColor
        ? options.richEmbedColor
        : 30975,
      description: messageContents,

    });
    richEmbed.setImage(image)
    // Add title if requested.
    if (options.title) {
      richEmbed.setTitle(options.title);
    }

    // Add source if requested.
    if (options.includeSource) {
      richEmbed.addField(
        "Author",
        `**${message.member.displayName}** in **${message.guild.name}/${(message.channel as TextChannel).name
        }**`
      );
    }

    // Add attachments if requested.
    if (options.copyAttachments) {
      const originalAttachment = message.attachments.first();
      if (originalAttachment) {
        richEmbed.attachFile(
          new discord.Attachment(
            originalAttachment.url,
            originalAttachment.filename
          )
        );

        const ext = path
          .extname(originalAttachment.url)
          .toLowerCase()
          .replace(".", "");
        if (ext && imageExts.includes(ext))
          richEmbed.setImage(`attachment://${originalAttachment.filename}`);
      }
    }


    let hook = new discord.WebhookClient(destChannel.id, destChannel.token, {
      disableEveryone: (options && options.removeEveryone),

    })
    await hook.send(richEmbed)


  }
  return;

}
async function downloadImage(url): Promise<Buffer> {
  return fetch(url).then(res => res.buffer());
}

function getImageLink(message: string, accurate): string {
  let links = getUrls(message);

  for (let entry of links) {
    if (isImageUrl(entry, accurate)) {
      return entry;
    }
  }
  return null;
}

main();