import 'dotenv/config';
import { Markup, Telegraf } from 'telegraf';
import dialog from './answers.js';

let user;
let userId
let isUserBot;
let MESSAGE_PATTERN;
const bot = new Telegraf(process.env.TICKET);

bot.start(startAction);
bot.command('restart', startAction);
bot.command('support', Telegraf.reply('world'));
bot.action("no", (ctx) => { console.log(ctx) });
bot.on("message", onMessage);

function setMessagePattern(user, userId, isUserBot) {
    MESSAGE_PATTERN = "user: { " + user + " }\n" + "user id: { " + userId + " }" + "\n" + "is user bot { " + isUserBot + " }" + "\n" + " USER MESSAGE: \n ";
};

async function onMessage(ctx) {
    let message = ctx?.message?.contact || ctx.message.text || ctx.update.message.text;
    let isPhoto = ctx?.update?.message?.photo || ctx?.message?.photo || ctx?.Context?.update?.message?.photo;
    switch (message) {
        case ctx?.message?.contact:
            await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + JSON.stringify(ctx?.message?.contact?.phone_number));
            await askForInfo(ctx);
            break
        case dialog.refuse:
            await ctx.reply("Ok");
            await askForInfo(ctx);
            break
        default:
            await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + message);
            await askForInfo(ctx);
            isPhoto && await sendPhoto(ctx);
            break
    }
}

async function sendPhoto(ctx) {
    let photo = ctx?.update?.message?.photo || ctx?.message?.photo || ctx?.Context?.update?.message?.photo;
    if (photo) {
        if (ctx.update.message.caption) {
            await ctx.telegram.sendMessage(process.env.postBox, ctx.update.message.caption);
        }
        await ctx.telegram.sendPhoto(process.env.postBox, photo[0].file_id);
    }
}

async function startAction(ctx) {
    user = JSON.stringify(ctx?.update?.message?.from?.username) ||
        JSON.stringify(ctx?.message?.from?.username) ||
        JSON.stringify(ctx?.message?.chat?.username) ||
        JSON.stringify(ctx?.update?.message?.chat?.username) ||
        JSON.stringify(ctx?.update?.message?.sender_chat?.username);
    userId = JSON.stringify(ctx?.update?.message?.from.id);
    isUserBot = JSON.stringify(ctx?.update?.message?.from.is_bot);
    setMessagePattern(user, userId, isUserBot);
    await setConstantButtonShareContact(ctx);
}

async function setConstantButtonShareContact(ctx) {
    const keyboard = Markup.keyboard([
        Markup.button.contactRequest(dialog.shareContact, false),
        Markup.button.callback(dialog.refuse, "no")
    ])
    return ctx.reply(dialog.anonimous, keyboard)
}

async function askForInfo(ctx) {
    return ctx.reply(dialog.askForInfo)
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
