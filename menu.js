import input from "input";
import {saveConfig} from "./configManager.js";

export async function showMainMenu() {
  console.log("\nВыберите действие:");
  console.log("1. Добавить чат");
  console.log("2. Удалить чат");
  console.log("3. Показать список чатов");
  console.log("4. Установить целевого бота");
  console.log("5. Завершить настройку");

  const choice = await input.text("Ваш выбор: ");
  return choice;
}

export class Menu{
    constructor(client, config){
        this.client = client;
        this.config = config;
    }

    async AddTarget(target){
        try{
            if(target === this.config.botTarget){
                console.log(`Этот чат уже назначен целевым ботом!: ${target}`);
                return false;
            }
        try {
            await this.client.getEntity(target);
        } catch (e) {
            console.log(`Не удалось найти чат с таким адресом!: ${target}`);
            return false;
        }
            if(!this.config.targets.includes(target)){
                this.config.targets.push(target);
                await saveConfig(this.config);
                console.log(`Чат добавлен: ${target}`);
                return true;
            }else{
                console.log(`Чат уже был добавлен: ${target}`);
                return false;
            }
        }catch(e){
            console.log(`Ошибка добавления чата ${target}: ${e.message}`);
            return false;
        }
    }

    async DeleteTarget(target){
        const index = this.config.targets.indexOf(target);
        if (index !== -1){
            this.config.targets.splice(index, 1);
            await saveConfig(this.config);
            console.log(`Чат удалён: ${target}`);
            return true;
        }else{
            console.log(`Чат: ${target} не найден`);
            return false;
        }
    }

    async ShowTargets(){
        console.log("Прослушка сообщений в:", this.config.targets.join(", "));
    }

    async SetBotTarget(target){
        if(!target){
            console.log("Имя бота не может быть пустым.");
            return false;
        }
        if(this.config.targets.includes(target)){
            console.log(`Этот чат нельзя сделать целевым ботом, он прослушивается!: ${target}`);
            return false;
        }
        try {
            await this.client.getEntity(target);
        } catch (e) {
            console.log(`Не удалось найти бота с таким адресом!: ${target}`);
            return false;
        }
        try{
            this.config.botTarget = target;
            await saveConfig(this.config);
            console.log(`Целевой бот изменён на: ${target}`);
            return true;
        }catch(e){
            console.log(`Ошибка добавления бота ${target}: ${e.message}`);
            return false;
        }
    }

}