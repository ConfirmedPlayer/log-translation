# log-translation

# Установка и запуск
Требуется пакетный менеджер [yarn](https://classic.yarnpkg.com/lang/en/docs/install)
* Склонируйте репозиторий
* Настройте config.yml в папке log-translation
* Перейдите в корневой каталог проекта
* Установите зависимости
```shell
yarn install
```
* Запустите проект (sudo требуется для регистрации сервиса systemd)
```shell
sudo node log-translation\index.js
```
* Закройте программу ```Ctrl-C```, если вы на linux и программа зарегистрировала себя как сервис
* Проверьте статус сервиса
```shell
sudo systemctl status log-translation
```
