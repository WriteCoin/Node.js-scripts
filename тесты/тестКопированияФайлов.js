const fs = require("fs")
const fsExtra = require("fs-extra")
const path = require('path')

const элементыПапки = fs.readdirSync("../", { encoding: "utf-8" })

const толькоФайлы = элементыПапки.filter((элемент) => {
    return fs.statSync(path.join('../', элемент)).isFile()
})

console.log(толькоФайлы)

// fsExtra.ensureDirSync('./тест1/тест2/тест3')

// fsExtra.copyFileSync('./тестКопированияФайлов.js', './тест1/тест2/тест3/тестКопированияФайлов.js')

// fs.copyFileSync('./тестКопированияФайлов.js', './тест1/тестКопированияФайлов.js')
