#!/bin/bash

# Запускаем интерактивный режим
node main.js

# После завершения node main.js запускаем процесс через pm2
echo "Запуск бота в фоне через pm2..."
pm2 restart solana-bot || pm2 start main.js --name solana-bot

# Сохраняем список процессов, чтобы они запускались при старте системы
pm2 save

echo "Бот запущен через pm2 и конфигурация сохранена."