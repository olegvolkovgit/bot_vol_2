import 'dotenv/config';
import { Markup, Telegraf } from 'telegraf';
import dialog from './answers.js';

let user;
let userId
let isUserBot;
let MESSAGE_PATTERN;
let counter = 0;

// const token = process.env.TICKET;

// if (token === undefined) {
//     throw new Error('BOT_TOKEN must be provided!')
// }

const bot = new Telegraf(process.env.TICKET);

// bot.use(Telegraf.log());

bot.on("message", onMessage);
bot.start(startAction);
// bot.command('support', Telegraf.reply('world'));
bot.command("restart", resetCounter);
bot.action("no", (ctx) => { console.log(ctx) });

async function onMessage(ctx) {
    counter++;
    let message = ctx?.message?.contact || ctx.message.text || ctx.update.message.text;
    let isPhoto = ctx?.update?.message?.photo || ctx?.message?.photo || ctx?.Context?.update?.message?.photo;
    if (message === "/restart") { counter = 0; }

    if (counter < 6 && (message || isPhoto)) {
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
                await askForInfo(ctx);
                await setButtonShareContact(ctx);
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + "User pressed start button");
                break
            case "/restart":
                await askForInfo(ctx);
                await setButtonShareContact(ctx);
                counter = 0
                break
            case ctx?.message?.contact:
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + JSON.stringify(ctx?.message?.contact?.phone_number));
                await alertLimitMessages(ctx);
                break
            case dialog.refuse:
                await ctx.reply("Ok");
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + message);
                await alertLimitMessages(ctx);
                break
            default:
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + message);
                await alertLimitMessages(ctx);
                break
        }
        isPhoto && await sendPhoto(ctx);
    } else {
        ctx.deleteMessage(ctx.update.message.message_id);
        (counter > 4) && ctx.reply(dialog.sorry);
    }
}

function resetCounter() {
    counter = 0;
    console.log(counter)
}

async function alertLimitMessages(ctx) {
    let availablemessages = 5 - counter;

    return ctx.reply(dialog.counter_prefix + " " + availablemessages + " " + dialog.counter_postfix);
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
    counter = 0;
}

async function setButtonShareContact(ctx) {
    const keyboard = Markup.keyboard([
        Markup.button.contactRequest(dialog.shareContact, false),
        Markup.button.callback(dialog.refuse, "no")
    ]).oneTime()

    return ctx.reply(dialog.anonimous, keyboard)
}

async function askForInfo(ctx) {
    return await ctx.reply(dialog.askForInfo)
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
