const fs = require("fs")
const fsExtra = require("fs-extra")
const os = require("os")
const path = require("path")
const readline = require("readline")

const SYNC_DIR = "Sync"
const WINDOWS_PATH = "/media/writecoin/D6260E52260E3451"
const WINDOWS_HOME = "Users/WriteCoin"

const ОШИБКИ_ЧТЕНИЯ_ПАПОК_ФАЙЛ = "ошибки-чтения-папок-sync.json"
const ОШИБКИ_КОПИРОВАНИЯ_ФАЙЛОВ_ФАЙЛ = "ошибки-копирования-файлов-sync.json"

function processLineByLine(filePath) {
    const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" })

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })

    const ошибкиПолученияФайлов = []
    const ошибкиКопированияФайлов = []
    const ошибкиПрокладыванияВыходныхПапок = []
    const ошибкиЗамераРазмеров = []
    const исходныеПути = []
    const выходныеПути = []

    return new Promise((resolve, reject) => {
        rl.on("line", (line) => {
            // обрабатывать каждую строку тут

            const полныйИсходныйПутьКПапке = path.join(
                os.homedir(),
                SYNC_DIR,
                line
            )
            const полныйВыходнойПутьКПапке = path.join(
                WINDOWS_PATH,
                WINDOWS_HOME,
                SYNC_DIR,
                line
            )

            try {
                fsExtra.ensureDirSync(полныйВыходнойПутьКПапке)
            } catch (ошибка) {
                console.error(
                    "Ошибка прокладывания выходного пути к папке",
                    ошибка
                )
                ошибкиПрокладыванияВыходныхПапок.push(ошибка)
                return
            }

            let исходныеФайлы

            try {
                const исходныеЭлементыПапки = fs.readdirSync(
                    полныйИсходныйПутьКПапке,
                    {
                        encoding: "utf-8",
                    }
                )

                исходныеФайлы = исходныеЭлементыПапки.filter((элемент) => {
                    return fs
                        .statSync(path.join(полныйИсходныйПутьКПапке, элемент))
                        .isFile()
                })
            } catch (ошибка) {
                console.error("Ошибка получения файлов папки", ошибка)
                ошибкиПолученияФайлов.push(ошибка)
                return
            }

            for (let index = 0; index < исходныеФайлы.length; index++) {
                const исходныйФайл = исходныеФайлы[index]
                const полныйПутьИсходного = path.join(
                    полныйИсходныйПутьКПапке,
                    исходныйФайл
                )
                const полныйПутьВыходного = path.join(
                    полныйВыходнойПутьКПапке,
                    исходныйФайл
                )

                // замер файлов перед копированием
                let успех = true
                let совпадают = false
                try {
                    const состояниеИсходного = fs.statSync(полныйПутьИсходного)
                    const состояниеВыходного = fs.statSync(полныйПутьВыходного)

                    const размерИсходного = состояниеИсходного["size"]
                    const размерВыходного = состояниеВыходного["size"]
                    совпадают = размерИсходного === размерВыходного
                    if (совпадают) {
                        console.log(
                            "Размеры совпадают:",
                            полныйПутьИсходного,
                            полныйПутьВыходного
                        )
                    }
                } catch (ошибка) {
                    console.error("Ошибка замера размеров", ошибка)
                    ошибкиЗамераРазмеров.push(ошибка)
                    успех = false
                }

                if (успех && !совпадают) {
                    try {
                        // console.log(
                        //     "Исходный путь",
                        //     полныйПутьИсходного,
                        //     "выходной путь",
                        //     полныйПутьВыходного
                        // )
                        fs.copyFileSync(
                            полныйПутьИсходного,
                            полныйПутьВыходного
                        )
                    } catch (ошибка) {
                        console.error("Ошибка копирования файла", ошибка)
                        ошибкиКопированияФайлов.push(ошибка)
                    }
                }

                исходныеПути.push(полныйПутьИсходного)
                выходныеПути.push(полныйПутьВыходного)
            }
        })

        rl.on("close", () => {
            resolve({
                ошибкиЧтенияПапок: ошибкиПолученияФайлов,
                ошибкиКопированияФайлов,
                ошибкиПрокладыванияВыходныхПапок,
                исходныеПути,
                выходныеПути,
            })
        })

        rl.on("error", reject)
    })
}

console.log("Копирование файлов Sync")

const pathFilesTxt = path.join(os.homedir(), SYNC_DIR, "sync-dirs.txt")

processLineByLine(pathFilesTxt)
    .then((результаты) => {
        const {
            ошибкиЧтенияПапок,
            ошибкиКопированияФайлов,
            ошибкиПрокладыванияВыходныхПапок,
            исходныеПути,
            выходныеПути,
        } = результаты

        fs.writeFileSync(
            path.join("./", ОШИБКИ_ЧТЕНИЯ_ПАПОК_ФАЙЛ),
            JSON.stringify(ошибкиЧтенияПапок),
            { encoding: "utf-8" }
        )
        fs.writeFileSync(
            path.join("./", ОШИБКИ_КОПИРОВАНИЯ_ФАЙЛОВ_ФАЙЛ),
            JSON.stringify(ошибкиКопированияФайлов),
            { encoding: "utf-8" }
        )
        fs.writeFileSync(
            path.join("./", "ошибки-прокладывания-выходных-путей-sync.json"),
            JSON.stringify(ошибкиПрокладыванияВыходныхПапок),
            { encoding: "utf-8" }
        )
    })
    .catch((err) => {
        console.error(err)
    })
