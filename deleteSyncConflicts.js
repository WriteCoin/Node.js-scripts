const fs = require("fs")
const os = require("os")
const path = require("path")
const readline = require("readline")

function processLineByLine(filePath) {
    const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" })

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })

    const conflicts = []
    const originals = []

    return new Promise((resolve, reject) => {
        rl.on("line", (line) => {
            // обрабатывать каждую строку тут
            conflicts.push(line)
            const originalPath =
                line.substring(0, line.lastIndexOf(".sync-conflict-")) +
                path.extname(line)
            originals.push(originalPath)
        })

        rl.on("close", () => {
            resolve([conflicts, originals])
        })

        rl.on("error", reject)
    })
}

const pathConflictsTxt = path.join(os.homedir(), "Sync", "sync-conflicts.txt")

processLineByLine(pathConflictsTxt)
    .then((results) => {
        const [conflicts, originals] = results
        console.log("Размеры файлов")

        let count = 0
        for (let index = 0; index < conflicts.length; index++) {
            const conflictPath = conflicts[index]
            const originalPath = originals[index]

            // console.log(path.resolve)
            // return

            const conflictFullPath = path.join(
                os.homedir(),
                "Sync",
                conflictPath
            )
            const originalFullPath = path.join(
                os.homedir(),
                "Sync",
                originalPath
            )

            const statsConflict = fs.statSync(conflictFullPath)
            const statsOriginal = fs.statSync(originalFullPath)

            const conflictSize = `${statsConflict["size"]}b`
            const originalSize = `${statsOriginal["size"]}b`

            console.log(originalPath, conflictSize, originalSize)

            if (conflictSize !== originalSize) {
                count++
            }
        }

        console.log()
        console.log("Количество конфликтов", conflicts.length)
        console.log("Количество несовпадающих размеров", count)
    })
    .catch((err) => {
        console.error(err)
    })
