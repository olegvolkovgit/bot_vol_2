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
            break
    }
}

async function startAction(msg) {
    user = JSON.stringify(msg?.update?.message?.from?.username) ||
        JSON.stringify(msg?.message?.from?.username) ||
        JSON.stringify(msg?.message?.chat?.username) ||
        JSON.stringify(msg?.update?.message?.chat?.username) ||
        JSON.stringify(msg?.update?.message?.sender_chat?.username);
    userId = JSON.stringify(msg?.update?.message?.from.id);
    isUserBot = JSON.stringify(msg?.update?.message?.from.is_bot);
    setMessagePattern(user, userId, isUserBot);
    await setConstantButtonShareContact(msg);
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
// async function onMessageForCollaborant(msg) {
//     try {
//         receiver = process.env.postBox;

//         if (messagesAreAllowed) {
//             if (msg?.message?.text || msg?.Context?.update?.message?.text) {
//                 let userMessage = msg.message.text || msg.update.message.text;
//                 await msg.telegram.sendMessage(receiver, "user: { " + user + " }\n" + "user id: { " + userId + " }" + "\n" + "is user bot { " + isUserBot + " }" + "\n" + " USER MESSAGE: \n " + userMessage);
//             }

//             if (msg?.update?.message?.photo || msg?.message?.photo || msg?.Context?.update?.message?.photo) {
//                 let photo = msg?.update?.message?.photo || msg?.message?.photo || msg?.Context?.update?.message?.photo;
//                 if (photo) {
//                     if (msg.update.message.caption) {
//                         await msg.telegram.sendMessage(receiver, msg.update.message.caption);
//                     }
//                     await msg.telegram.sendPhoto(receiver, photo[0].file_id);
//                 }
//             }
//         }

//         if (messageCounter > 2) {
//         }

//         messageCounter++

//         await msg.replyWithHTML(dialog.thanks[language], Markup.inlineKeyboard([
//             [
//                 Markup.button.callback(dialog.endChat[language], "finish"),
//                 Markup.button.callback(dialog.forward[language], "forward")
//             ]
//         ]));
//     } catch (e) {
//         console.log(e)
//     }
// }

// async function forward(msg) {
//     try {
//         msg.reply(dialog.forward_msg[language] + (3 - messageCounter).toString());
//     } catch (e) {
//         console.log(e)
//     }
// }

// async function endChatSendAdvise(msg) {
//     try {
//         await msg.reply(dialog.advise[language]);
//         !messagesAreAllowed && msg.deleteMessage(msg.update.message.message_id);
//     } catch (e) {
//         console.log(e);
//     }
// }

// async function stopMessaging(msg) {
//     try {
//         if (messageCounter > 2) {
//             await msg.reply(
//                 dialog.warningMessageLimit[language]
//             );
//             await endChatSendAdvise(msg);
//         }
//     } catch (e) {
//         console.log(e);
//     }
// };

// async function uaAction(msg) {
//     try {
//         language = "ua";
//         await msg.reply(dialog.set_collaborant[language]);
//     } catch (e) {
//         console.log(e)
//     }
// }

// async function ruAction(msg) {
//     try {
//         language = "ru";
//         msg.reply(dialog.set_collaborant[language]);
//     } catch (e) {
//         console.log(e);
//     }
// }


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
