const { exec, spawn } = require("child_process")

function runCommand(command) {
    // const cmd = spawn(command)

    // cmd.stdout.pipe(process.stdout)

    // cmd.stdout.on("data", (data) => {
    //     console.log(`поток вывода: ${data}`)
    // })

    // cmd.stderr.on("data", (data) => {
    //     console.error(`поток ошибок: ${data}`)
    // })

    // cmd.on("close", (code) => {
    //     console.log(`Процесс завершен с кодом ${code}`)
    // })

    exec(command, { maxBuffer: 1024 * 1024 * 10}, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка выполнения команды: ${error.message}`)
            return
        }
        if (stderr) {
            console.error(`Ошибка выполнения команды: ${stderr}`)
            return
        }
        console.log(`Результат выполнения команды: ${stdout}`)
    })
}

function scheduleCommand(command, time) {
    const currentTime = new Date()
    const scheduledTime = new Date(time)

    const delay = scheduledTime.getTime() - currentTime.getTime()

    if (delay < 0) {
        console.error("Указанное время уже прошло!")
        return
    }

    setTimeout(() => {
        console.log(`Запуск команды: ${command}`)
        runCommand(command)
    }, delay)
    console.log(`Команда запланирована на ${scheduledTime}`)
}

// Пример использования
const command = process.argv[2] // команда, которую нужно запустить
const scheduledTime = process.argv[3] // время запуска команды в формате 'HH:mm:ss'

const currentDate = new Date()

const time = `${currentDate.getFullYear()}-${
    currentDate.getMonth() + 1
}-${currentDate.getDate()}T${scheduledTime}`

scheduleCommand(command, time)
