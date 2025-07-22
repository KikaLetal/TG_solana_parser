import fs from "fs/promises";

const CONF_PATH = "./config.json";

export async function loadConfig(){
    try{
        const data = await fs.readFile(CONF_PATH, "utf-8");
        return JSON.parse(data);
    }catch(e){
        console.log("Не удалось загрузить конфиг, создаём новый");
        await fs.writeFile(CONF_PATH, JSON.stringify({targets: [], botTarget: ""}, null, 2), "utf8");
        return {targets: [], botTarget: ""};
    }
}

export async function saveConfig(config){
    await fs.writeFile(CONF_PATH, JSON.stringify(config, null, 2), "utf8");
}
