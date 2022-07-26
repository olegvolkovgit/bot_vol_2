import 'dotenv/config';
import { Markup, Telegraf } from 'telegraf';
import dialog from './answers.js';
import constants from './constants.js';

let user;
let userId
let isUserBot;
let counter = 5;
let DOES_FIRST_MESSAGE_WAS_SHOWN = false;
let USER_HAD_SHARE_CONTACT = false;

const bot = new Telegraf(process.env.TICKET);

bot.use(Telegraf.log());

bot.on("message", onMessage);
bot.start(startAction);
bot.command("restart", resetCounter);
bot.action("no", (ctx) => { console.log(ctx) });

async function onMessage(ctx) {
    let message = ctx?.message?.contact || ctx.message.text || ctx.update.message.text;
    let isPhoto = ctx?.update?.message?.photo || ctx?.message?.photo || ctx?.Context?.update?.message?.photo;
    if (message === "/restart") { counter = 5; DOES_FIRST_MESSAGE_WAS_SHOWN = false }
    if (message === "/support") { onIssue(ctx) };

    if (counter > 0 && (message || isPhoto)) {
        user = JSON.stringify(ctx?.update?.message?.from?.username) ||
            JSON.stringify(ctx?.message?.from?.username) ||
            JSON.stringify(ctx?.message?.chat?.username) ||
            JSON.stringify(ctx?.update?.message?.chat?.username) ||
            JSON.stringify(ctx?.update?.message?.sender_chat?.username);
        userId = JSON.stringify(ctx?.update?.message?.from.id);
        isUserBot = JSON.stringify(ctx?.update?.message?.from.is_bot);

        let MESSAGE_PATTERN = "user: { " + user + " }\n" + "user id: { " + userId + " }" + "\n" + "is user bot { " + isUserBot + " }" + "\n" + " USER MESSAGE: \n ";

        switch (message) {
            case "/start":
                await setButtonShareContactWithText(ctx);
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + constants.START_WAS_PRESSED);
                break
            case "/restart":
                await askForInfo(ctx);
                await setButtonShareContactWithText(ctx);
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + constants.RESTART_WAS_PRESSED);
                counter = 5;
                break
            case ctx?.message?.contact:
                counter--;
                USER_HAD_SHARE_CONTACT = true
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + JSON.stringify(ctx?.message?.contact?.phone_number));
                await improveData(ctx);
                await alertLimitMessages(ctx);
                break
            default:
                counter--;
                await askForInfo(ctx);
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + message);
                counter ? await alertLimitMessages(ctx) : await alertNoMessages(ctx);
                await setButtonShareContact(ctx);
                break
        }
        if (isPhoto) { await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + constants.PHOTO_SENT); await sendPhoto(ctx); }
    } else {
        if (counter <= 0) {
            ctx.reply(dialog.sorry);
            ctx.deleteMessage(ctx.update.message.message_id);
        }
    }
}

function resetCounter() {
    counter = 5;
}

async function alertLimitMessages(ctx) {
    return ctx.reply(dialog.counter_prefix + " " + counter + " " + dialog.counter_postfix);
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

async function onIssue(ctx) {
    await ctx.reply(dialog.onIssue);
    await ctx.telegram.sendMessage(process.env.postBox, "!!! ALERT !!!");
}

function startAction() {
    this.resetCounter();
}

async function alertNoMessages(ctx) {
    return await ctx.reply(dialog.noMessages);
}

async function improveData(ctx) {
    return await ctx.reply(dialog.improvement);
}

async function setButtonShareContactWithText(ctx) {
    const keyboard = Markup.keyboard([
        Markup.button.contactRequest(dialog.shareContact, false),
    ]).resize();

    return await ctx.replyWithHTML(dialog.anonimous, keyboard);
}

async function setButtonShareContact(ctx) {
    if (!USER_HAD_SHARE_CONTACT) {
        const keyboard = Markup.keyboard([
            Markup.button.contactRequest(dialog.shareContact),
        ]).resize();
        return await ctx.replyWithHTML(dialog.callbackContact, keyboard);
    }

    return
};

async function askForInfo(ctx) {
    if (!DOES_FIRST_MESSAGE_WAS_SHOWN) {
        DOES_FIRST_MESSAGE_WAS_SHOWN = true;
        return await ctx.reply(dialog.askForInfo);
    }
    return
}

// async function onStart(ctx) {
//     return await ctx.reply(dialog.atStart);
// }

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
