const isOnline = require('is-online')
const spawn = require('cross-spawn')

async function checkInternetConnection() {
    try {
        const online = await isOnline()
        return online
    } catch (error) {
        console.error("Ошибка проверки интернет-соединения:", error.message)
        return false
    }
}

function runApplication(name, command) {
    const process = spawn(command, { detached: true })
    // console.log(`Приложение ${command} запущено: ${process.stdout}`)

    process.stdout.on("data", (data) => {
        console.log(`Приложение ${name} запущено: ${data}`)
    })

    process.stderr.on("data", (data) => {
        console.error(`Ошибка приложения ${name}: ${data}`)
    })

    process.on("close", (code) => {
        console.log(`Приложение ${name} завершило свою работу с кодом ${code}`)
    })

    // exec(command, function (error, stdout, stderr) {
    //     if (error) {
    //         console.error(
    //             `Ошибка запуска приложения ${command}: ${error.message}`
    //         )
    //         return
    //     }
    //     console.log(`Приложение ${command} запущено: ${stdout}`)
    // })
}

async function runApplications() {
    console.log("Соединение с интернетом обнаружено. Запуск программ...")

    const applications = [
        // ['chatgpt', 'python $HOME/Sync/Projects/Python/chatgpt/main.py'],
        ["Браузер", "firefox"],
    ]

    await Promise.all(applications.map((a) => runApplication(a[0], a[1])))

    // Здесь вы можете добавить запуск ваших приложений.
    // Пример запуска Notepad в Windows:
    // exec('notepad.exe', (error, stdout, stderr) => {
    //   if (error) {
    //     console.error(`Error starting application: ${error.message}`);
    //     return;
    //   }
    //   console.log(`Application started: ${stdout}`);
    // });
}

async function main() {
    console.log("Ожидания подключения к интернету...")

    // Проверяем соединение с интернетом каждые 5 секунд
    const interval = setInterval(async () => {
        const online = await checkInternetConnection()
        if (online) {
            clearInterval(interval)
            await runApplications()
        }
    }, 5000)
}

main()
