const fs = require("fs")

const текстФайлаКонфигурации = fs.readFileSync(
    "ошибки-копирования-файлов-sync.json",
    { encoding: "utf-8" }
)

const массивКонфигурации = JSON.parse(текстФайлаКонфигурации)

const новыйМассив = массивКонфигурации.map((объект) => объект.ошибка)

console.log(новыйМассив.slice(0, 5))

fs.writeFileSync(
    "коррект_ошибки-копирования-файлов-sync.json",
    JSON.stringify(новыйМассив, null, 2),
    {
        encoding: "utf-8",
    }
)
