import fs from "fs/promises";
import path from 'path';

const LOG_PATH = "./logs/";

async function getLogFilePath(){
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    try {
        await fs.mkdir(LOG_PATH, { recursive: true });
    } catch (e) {
        console.error("Не удалось создать папку логов:", e);
    }

    const fileName = `Log-${day}-${month}-${year}.json`

    return path.join(LOG_PATH, fileName);
}

export async function log(source, message, time){
    time = new Date(time*1000);
    const timeStr = time.toLocaleTimeString('ru-RU', {
        hour12: false,
        timeZone: 'Europe/Moscow'
    });

    const LogEntry = {
        source,
        message,
        timeStr
    };
    const CurLogPath = await getLogFilePath();

    let logs = []; // чаты для прослушки - каналы, боты, личные сообщения
    try{
        const data = await fs.readFile(CurLogPath, "utf8");
        logs = JSON.parse(data);
    } catch(e){
        if (e.code !== 'ENOENT') {
            console.error("Не удалось прочитать логи:", e);
        }
    }

    logs.push(LogEntry);

    await fs.writeFile(CurLogPath, JSON.stringify(logs, null, 2), "utf8");
    console.log(`от: ${source}, текст: ${message}, время: ${timeStr}`);
}
