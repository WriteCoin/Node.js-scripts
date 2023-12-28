const { spawn } = require("child_process")
// const devnull = require("dev-null")

process.stdin.setEncoding("utf-8")

class IPython {
    defaultCmd = ""
    maxStartOutput = 2

    constructor(path = "ipython") {
        this.path = path
        this.data = null
        this.error = null
        this.isError = false
        this.isData = false
        this.cmd = this.defaultCmd
        this.numOp = 0
        this.isInvite = false
        this.logging = true
    }

    checkProcess() {
        if (!this.process) {
            throw `Процесс ${this.path} отсутствует`
        }
    }

    logPrefix() {
        this.checkProcess()
        return `[IPython PID=${this.process.pid}]:`
    }

    log(...params) {
        this.checkProcess()
        if (this.logging) {
            console.log(this.logPrefix(), ...params)
        }
    }

    logError(...params) {
        this.checkProcess()
        console.error(this.logPrefix(), ...params)
    }

    run() {
        return new Promise((resolve, reject) => {
            let counter = 0
            let outputs = []

            this.process = spawn(this.path, ["-i"])

            // console.log("Запуск процесса IPython с pid=", this.process.pid)
            this.log("Запуск процесса")

            const dataRunHandler = (data) => {
                const outputData = data.toString()

                counter++
                outputs.push(outputData)

                if (counter == this.maxStartOutput) {
                    outputs.forEach((output, i) => {
                        if (i === 0) {
                            this.log("Приглашение", output)
                        } else {
                            this.log(output)
                        }
                    })
                    this.numOp++
                    this.process.stdout.removeListener("data", dataRunHandler)
                    // this.process.stdout.on("data", this.inviteHandler)
                    // this.process.stdout.on('resume', (stream) => {
                    // 	console.log('resume', stream ? stream.toString() : stream)
                    // })
                    // this.process.stdout.on('readable', (stream) => {
                    // 	console.log('readable', stream ? stream.toString() : stream)
                    // })

                    resolve()
                }
            }

            const errorRunHandler = (data) => {
                const outputData = data.toString()
                this.logError("Ошибка при запуске", outputData)
                this.process.stderr.removeListener("data", errorRunHandler)
                this.process.stderr.on("data", this.errorHandler)
                reject(outputData)
            }

            this.process.stdout.on("data", dataRunHandler)

            this.process.stderr.on("data", errorRunHandler)

            // обещание получать данные впоследствии
            // this.promise = new Promise((resolve, reject) => {})

            // Обработка завершения процесса
            this.process.on("close", (code, signal) => {
                this.log(`Завершен с кодом ${code}, сигнал ${signal}`)
                this.process = null
            })
        })
    }

    inviteHandler = (data) => {
        this.checkProcess()
        this.numOp++
        this.log(`In [${this.numOp}]: `)
        this.process.stdout.removeListener("data", this.inviteHandler)
    }

    // dataHandler = (data) => {
    //     // console.log(this.isInvite)
    //     if (!this.isInvite) {
    //         this.log(this.cmd)
    //         // process.stdin.write(this.cmd)
    //         // process.stdin.write('\n')
    //         this.data = data.toString()
    //         this.isData = true
    //         this.cmd = this.defaultCmd
    //         // this.numOp++
    //         this.isInvite = true
    //     } else {
    //         this.log()
    //         this.log(`In [${this.numOp}]: `)
    //         this.isInvite = false
    //     }
    // }

    // errorHandler = (error) => {
    //     // console.log(this.isInvite)
    //     if (!this.isInvite) {
    //         this.log(this.cmd)
    //         // process.stdin.write(this.cmd)
    //         // process.stdin.write('\n')
    //         this.error = error.toString()
    //         this.isError = true
    //         this.cmd = this.defaultCmd
    //         // this.numOp++
    //         this.isInvite = true
    //     } else {
    //         this.isInvite = false
    //     }
    // }

    command(str) {
        this.checkProcess()
        const cmd = str.endsWith("\n") ? str : `${str}\n`
        return new Promise((resolve, reject) => {
            const dataHandler = (data) => {
                this.log(cmd)
                this.log(`Out [${this.numOp}]:`)
                const outData = data.toString()
                const ended = `\nIn [${this.numOp + 1}]: `
                let out
                if (outData.endsWith(ended) || outData.endsWith("\n" + ended)) {
                    const index = outData.lastIndexOf(ended)
                    out = outData.slice(0, index)
                } else {
                    out = outData
                }
                this.log(out)
                this.process.stdout.removeListener("data", dataHandler)
                this.inviteHandler()
                // new Promise((res, rej) => {
                //     console.log("ожидания приглашения")
                //     this.process.stdout.on("data", (data) => {
                //         console.log("приглашение")
                //         try {
                //             this.inviteHandler(data)
                //             res()
                //         } catch (e) {
                //             rej(e)
                //         }
                //     })
                // }).then((_) => {
                //     resolve(out)
                // }).catch((e) => {
                //     reject(e)
                // })
                resolve(out)
            }

            const errorHandler = (error) => {
                const errorData = error.toString()
                this.logError(`Out [${this.numOp}]: Ошибка`)
                const ended = `\n\nIn [${this.numOp + 1}]: `
                const index = outData.lastIndexOf(ended)
                const out = errorData.slice(
                    0,
                    index === -1 ? errorData.length : index
                )
                this.process.stderr.removeListener("data", errorHandler)
                this.inviteHandler()
                reject(out)
            }

            this.process.stdout.on("data", dataHandler)
            this.process.stderr.on("data", errorHandler)

            this.process.stdin.write(cmd, (error) => {
                if (error) {
                    reject(error)
                }
            })

            // console.log("команда передана")

            // this.numOp++

            // const get = () => {
            //     if (this.isError) {
            //         console.error(`Out [${this.numOp}]: Ошибка`)
            //         console.error(this.error)
            //         // this.logError("Ошибка", this.error)
            //         const error = this.error
            //         this.error = null
            //         this.isError = false
            //         clearInterval(interval)
            //         this.log()
            //         reject(error)
            //     }

            //     if (this.isData) {
            //         console.log(`Out [${this.numOp}]:`)
            //         // console.log("данные", this.data)
            //         // console.log(this.numOp)
            //         const ended = `\n\nIn [${this.numOp + 1}]: `
            //         const out = this.data.slice(0, this.data.lastIndexOf(ended))
            //         // console.log(ended)
            //         // console.log(this.data && this.data.endsWith(ended))
            //         // console.log("данные", this.data)
            //         const data = out
            //         this.data = null
            //         this.isData = false
            //         clearInterval(interval)
            //         resolve(data)
            //     }
            // }

            // const interval = setInterval(get, 100)

            // while (!this.isError && !this.isData) {}
        })
    }

    close() {
        // this.process.removeAllListeners()
        this.process.kill()
        // this.log("Процесс ")
        // this.process = null
    }
}

async function main() {
    const ipython = new IPython()
    await ipython.run()
    await ipython.command("a = 5")
    const res = await ipython.command("print(a)")
    ipython.close()
    // ipython
    //     .command("print(1)")
    //     .then((output) => {
    //         console.log(output) // Вывод команды `print(1)`
    //         return ipython.command("from pprint import pprint\npprint(2 + 3)")
    //     })
    //     .then((output) => {
    //         console.log(output) // Вывод команды `from pprint import pprint\npprint(2 + 3)`
    //     })
    // console.log("процесс завершен")
}

main()

// while (true) {}

// // Запуск команды в фоновом процессе
// const proc_interp = spawn("ipython")

// // Перенаправление вывода в dev/null
// // proc_interp.stdout.pipe(devnull());
// // proc_interp.stderr.pipe(devnull());

// proc_interp.stdout.pipe(process.stdout)

// // Обработка стандартного потока ввода
// proc_interp.stdin.write("print(1 + 1)\n")

// proc_interp.stdin.write("print(2 +)\n")

// proc_interp.stdin.end()

// console.log("Введите текст: ")

// // Событие 'data' срабатывает при вводе данных
// process.stdin.on("data", function (data) {
//     // Выводим введенные данные
//     console.log("Вы ввели: " + data)

//     // Завершаем работу программы после ввода данных
//     process.exit()
// })
