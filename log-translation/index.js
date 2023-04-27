const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chokidar = require('chokidar');
const os = require('os');
const { execSync } = require('child_process');

// Подключение конфига
const configPath = path.join(__dirname, 'config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

// Инициализация watcher для файлов с расширением .log
const watcher = chokidar.watch(`${config.inputDirectory}/*.log`, { persistent: true });

// systemd сервис
const systemdService = `
[Unit]
Description=Log translation service

[Service]
Type=simple
ExecStart=/usr/bin/node ${__filename}
Restart=always
User=root

[Install]
WantedBy=multi-user.target
`;

// Функция, возвращающая username и pid по uid
function getUserAndPidFromUid(uid)
{
  const { username } = os.userInfo(uid);
  const pid = process.pid;
  return { username, pid };
}

// Функция, следящая за изменениями в указанном каталоге
function runWatcher()
{
  watcher.on('change', (filePath) =>
  {
    const entry = fs.readFileSync(filePath, 'utf8');

    const { uid } = fs.statSync(filePath);
    const { username, pid } = getUserAndPidFromUid(uid);

    const logData =
    {
      message: entry,
      timestamp: new Date().toISOString(),
      user: username,
      processId: pid,
    };

    const outputFileName = `${path.basename(filePath)}.json`;
    const outputFilePath = path.join(config.outputDirectory, outputFileName);
    const logDataJson = JSON.stringify(logData); // Конвертация logData в JSON

    fs.appendFileSync(outputFilePath, `${logDataJson}\n`); // Запись лога в JSON
  });
}

// Регистрация сервиса systemd
function registerService()
{
  const path = '/etc/systemd/system/log-translation.service';

  if (!fs.existsSync(path))
  {
    fs.writeFileSync(path, systemdService);
    execSync('sudo systemctl daemon-reload');
    execSync('sudo systemctl enable log-translation');
    execSync('sudo systemctl start log-translation');
  
    console.log('Сервис зарегистрирован\n');
  }
  console.log('Пожалуйста, закройте программу, если она запущена не как сервис systemd');
}


switch (os.platform())
{
  case 'linux':
    {
      registerService();
      runWatcher();
      break;
    }
  default:
    {
      runWatcher();
      break;
    }
}
