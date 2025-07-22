import fs from "fs/promises";

const PRCD_CONTR_PATH = "./ProcessedContracts.json";

let cache = null;

export async function loadProcessed(){
    if (cache) return cache;

    try{
        const data = await fs.readFile(PRCD_CONTR_PATH, "utf-8");
        cache = JSON.parse(data);
        return cache;
    }catch(e){
        console.log("Не удалось загрузить файл контрактов, создаём новый");
        cache = {};
        await saveProcessed(cache);
        return cache;
    }
}

export async function saveProcessed(processed){
    try {
        await fs.writeFile(PRCD_CONTR_PATH, JSON.stringify(processed, null, 2), "utf8");
        cache = processed;
    } catch (e) {
        console.log("Ошибка при сохранении файла обработанных контрактов:", e);
    }
}

export async function isProcessed(address) {
    const processed = await loadProcessed();
    return !!processed[address];
}

export async function markProcessed(address) {
    const processed = await loadProcessed();
    if(!processed[address]){
        processed[address] = true;
        await saveProcessed(processed);
    }
}
