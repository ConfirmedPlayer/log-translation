const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chokidar = require('chokidar');
const os = require('os');
const { execSync } = require('child_process');


const configPath = path.join(__dirname, 'config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));


const watcher = chokidar.watch(`${config.inputDirectory}/*.log`, { persistent: true });


const systemdService = `
[Unit]
Description=Log translation service

[Service]
Type=simple
ExecStart=/usr/bin/node ${__filename}
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
`;


function getUserAndPidFromUid(uid)
{
  const { username, uid: userId } = os.userInfo(uid);
  const pid = process.pid;
  return { username, userId, pid };
}


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
    const logDataJson = JSON.stringify(logData);

    fs.appendFileSync(outputFilePath, `${logDataJson}\n`);
  });
}


function registerService()
{
  const path = '/etc/systemd/system/log-translation.service'

  if (!fs.existsSync(path))
  {
    fs.writeFileSync(path, systemdService);
    execSync('systemctl daemon-reload');
    execSync('systemctl enable log-translation');
    execSync('systemctl start log-translation');
  
    console.log('Service successfully registered');
  }
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
