import 'dotenv/config';
import { loadConfig } from "./configManager.js";
import { loadSession, saveSession } from "./sessionManager.js";
import { isProcessed, markProcessed } from "./processedContractsManager.js";

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import input from "input";

import {Menu, showMainMenu} from "./menu.js";
import {extractSolanaAddress, formatPhoneNumber} from "./validators.js";

import { log } from "./logerManager.js"

const apiId = Number(process.env.apiId);
const apiHash = process.env.apiHash;

async function authorizeClient(client){
    await client.start({
            phoneNumber: async () => {
                while(true){
                    const rawNumber = await input.text("Введите номер: ");
                    const formattedPhoneNumber = await formatPhoneNumber(rawNumber);
                    if(formattedPhoneNumber){
                        return formattedPhoneNumber;
                    }
                    else {
                        console.log("Неверный номер. Попробуйте снова");
                    }
                } 
            },
            password: async () => await input.text("Введите пароль: "),
            phoneCode: async () =>
                await input.text("Введите полученный код: "),
            onError: (err) => console.log(err),
        });
        await saveSession(client.session.save());
        console.log("Сессия успешно сохранена.");
}

function createHandler(client, botEntity){
    return async function handler(event) {
        try {
            const sender = await client.getEntity(event.message.peerId);
            const text = event.message.message;
            const tokenAddresses = await extractSolanaAddress(text);

            if (!botEntity) {
                console.log("Целевой бот не задан, сообщение не отправляется");
                return;
            }

            if(tokenAddresses.length > 0){
                for (const address of tokenAddresses){
                    if(await isProcessed(address)) continue;
                    try{
                        await client.sendMessage(botEntity, { message: address });
                        await markProcessed(address);
                        await log(`@${sender.username || sender.id}`, address, event.message.date);
                    } catch(e){
                        console.log("Не удалось отправить сообщение: ", e)
                    }
                }
            }
        
        } catch (e) {
            console.log("Ошибка в обработчике сообщений:", e);
        }
    }
        
}

let CurHandler = null;
async function updateHandler(client, config){ // для изменения конфига: чатов, бота таргета.
    if(CurHandler){
        client.removeEventHandler(CurHandler); // очищаем старый обработчик
    }

    const chats = []; // чаты для прослушки - каналы, боты, личные сообщения
    for(const target of config.targets){
        try{
            const entity = await client.getEntity(target);
            chats.push(entity);
        } catch(e){
            console.log(`Не удалось получить сущность для ${target} `, e.message);
        }
    }

    if(chats.length === 0){
        console.log("На данный момент ни один чат не прослушивается.");
    }

    let botEntity = null;
    try{
        botEntity = await client.getEntity(config.botTarget); // получаем актуальную сущность бота таргета 
    }catch(e){
        console.log("Не удалось найти целевого бота: ", e)
        return;
    }

    CurHandler = createHandler(client, botEntity);
    client.addEventHandler(CurHandler, new NewMessage({
        incoming: true, 
        chats: chats.map(chat => chat.id)
    }));

    console.log("Конфиг обновлён.");
    
}

async function main() {
    const rawStringSession = await loadSession();
    let stringSession = new StringSession(rawStringSession);
    let isNewSession = false;

    let client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    try {
        await client.connect();
        await client.getMe();
    } catch (e) {
        console.log("Cессия битая или устарела. ", e.message || e);
        try{ client.disconnect(); } catch{}

        stringSession = new StringSession("");
        isNewSession = true;

        client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
        });
    }

    if(isNewSession){
        await authorizeClient(client);
    }
    console.log("Вы подключены.");


    const config = await loadConfig(); // сам конфиг

    const menu = new Menu(client, config); // класс меню для управления командами

    let botEntity = null;
    while(!botEntity){
        try{
            botEntity = await client.getEntity(config.botTarget); // получаем актуальную сущность бота таргета 
        }catch(e){
            const newBotTarget = await input.text("Введите username целевого бота: ");
            await menu.SetBotTarget(newBotTarget);
        }
    }

    await updateHandler(client, config);

    setInterval(async() =>{ // проверяем чтобы не упало всё вдруг
        try {
            await client.getMe();
        } catch (e) {
            console.log("[PING] Ошибка соединения:", e.message || e);
            process.exit(1);
        }
    }, 10 * 60 * 1000);

    while(true){ // команды управления
        const choice = await showMainMenu();

        switch(choice){
            case "1":
                const newChat = await input.text("Введите username чата: ");
                if(await menu.AddTarget(newChat)){
                    await updateHandler(client, config);
                }
                break;
            case "2":
                const DeletedChat = await input.text("Введите username чата для удаления: ");
                if(await menu.DeleteTarget(DeletedChat)){
                    await updateHandler(client, config);
                }
                break;
            case "3":
                await menu.ShowTargets();
                break;
            case "4":
                const newBotTarget = await input.text("Введите username целевого бота: ");
                if(await menu.SetBotTarget(newBotTarget)){
                    await updateHandler(client, config);
                }
                break;
            default:
                console.log("Неверная команда.");
                break;
        }

        await saveSession(client.session.save());
    }
}

(async () => {
    while(true){
        try {
            await main();
        } catch (e) {
            console.log("Скрипт упал с ошибкой: ", e);
        }

        console.log("Перезапуск через 10 секунд...");
        await new Promise(res => setTimeout(res, 10000)); // если что-то не так, тогда ждём 10 секунд и снова попробум запустить
    }
})();
