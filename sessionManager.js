import fs from "fs/promises";

const SESS_PATH = './session.json';

export async function loadSession() { // подгружаем последнюю сессию
  try {
    const data = await fs.readFile(SESS_PATH, 'utf8');
    const json = JSON.parse(data);
    return json.stringSession || '';
  } catch(e) {
    if(e.code === "ENOENT"){ // если файла нет 
        await fs.writeFile(SESS_PATH, JSON.stringify({stringSession: ""}, null, 2), "utf8");
        return ''; 
    }
    throw e;
  }
}

export async function saveSession(stringSession) {
    const json = {stringSession };
    await fs.writeFile(SESS_PATH, JSON.stringify(json, null, 2), "utf8");
}