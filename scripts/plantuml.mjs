import plantuml from "node-plantuml";
import fs from "fs";
import { readdir, readFile, mkdir } from "fs/promises";
import path from "path";

const myArgs = process.argv.slice(2);
const plantUmlExtension = ".puml";

for (const arg of myArgs) {
  const targetFile = path.parse(arg);
  validatePlantUmlExtensionType(targetFile.ext);

  const content = await readFile(arg, "utf8");
  validateNonEmptyContent(content, arg);

  const len = (content.match(/newpage/g) || []).length;

  await createDirectoryStructure(targetFile);
  const targetDirectory = targetFile.dir + path.sep + "images" + path.sep;

  for (let i = 0; i <= len; i++) {
    await generatePage(content, i, targetDirectory, targetFile.name);
  }
}

async function generatePage(content, page, targetDirectory, targetNamePrefix) {
  const generated = plantuml.generate(content, {
    format: "svg",
    pipeimageindex: page,
  });

  const outputFile = targetDirectory + targetNamePrefix + "-" + page + ".svg";

  console.log("Begun generation of " + outputFile);

  generated.out.pipe(fs.createWriteStream(outputFile)).on("finish", (_) => {
    console.log("Finished generation of " + outputFile);
  });
}

async function createDirectoryStructure(target) {
  try {
    await mkdir(target, { recursive: true });
  } catch (err) {
    //  nop if directory doesn't exist
  }
}

function validatePlantUmlExtensionType(extension) {
  if (plantUmlExtension !== extension.toLowerCase()) {
    throw Error("Expecting a .puml extension, instead got: " + extension);
  }
}

function validateNonEmptyContent(content, filepath) {
  if (content.length === 0) {
    throw Error("Content must not be empty, however not true for " + filepath);
  }
}
