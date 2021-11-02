import plantuml from 'node-plantuml'
import fs from 'fs'
import {readFile, mkdir} from 'fs/promises'
import path from 'path'

const myArgs = process.argv.slice(2)

for (const arg of myArgs) {
    const pathObj = path.parse(arg)

    const content = await readFile(arg, 'utf8')
    const len = (content.match(/newpage/g) || []).length

    const targetDirectory =
        pathObj.dir + path.sep + 'images' + path.sep + pathObj.name + path.sep

    try {
        await mkdir(targetDirectory, {recursive: true})
    } catch (err) {
        //  nop if directory doesn't exist
    }

    //TODO code me - get from the arg, regex for name - extension & before last slash
    const prefix = 'myPrefix';

    for (let i = 0; i <= len; i++) {
        await generatePage(content, i, targetDirectory, prefix)
    }
}

async function generatePage(content, page, targetDirectory, targetPrefix){
    const generated = plantuml.generate(content, {format: 'png', pipeimageindex: page})

    const outputFile =
      targetDirectory + targetPrefix + '-plantuml-image-' + page + '.png'

    console.log('starting:' + outputFile)

    console.log(content.length)

    generated.out.pipe(fs.createWriteStream(outputFile)).on('finish', (_) => {
        console.log(
          'generated image ' +
          outputFile
        )
    })
}