import plantuml from "node-plantuml";
import fs from "fs";
import { readdir, readFile, mkdir, stat } from "fs/promises";
import path from "path";

const myArgs = process.argv.slice(2);
const plantUmlExtension = ".puml";

for (const arg of myArgs) {
  if (await isDirectory(arg)) {
    const plants = await recursivePlantUmlFileSearch(arg);

    console.log("PlantUml files: " + plants);

    for (const plant of plants) {
      await generatePlantUmlImage(plant);
    }
  } else {
    await generatePlantUmlImage(arg);
  }
}

async function recursivePlantUmlFileSearch(directory) {
  console.log("Directory " + directory);
  const files = await readdir(directory);
  let plants = [];

  for (const file of files) {
    const subFile = directory + path.sep + file;

    if (await isDirectory(subFile)) {
      const leaves = await recursivePlantUmlFileSearch(subFile);
      if (leaves.length > 0) {
        plants.push(leaves);
      }
    } else {
      if (hasPlantUmlExtension(subFile)) {
        plants.push(subFile);
      }
    }
  }

  return plants;
}

/**
 * Creates a rendering from a Plant UML file.
 */
async function generatePlantUmlImage(filepath) {
  const targetFile = path.parse(filepath);
  validatePlantUmlExtensionType(targetFile.ext);

  const content = await readFile(filepath, "utf8");
  validateNonEmptyContent(content, filepath);

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

/**
 * Determine whether a directory exists at the given `path`.
 */
async function isDirectory(path) {
  const stats = await stat(path);

  return stats.isDirectory();
}

function hasPlantUmlExtension(extension) {
  return extension.toLowerCase().endsWith(plantUmlExtension);
}

function validatePlantUmlExtensionType(extension) {
  if (!hasPlantUmlExtension(extension)) {
    throw Error("Expecting a .puml extension, instead got: " + extension);
  }
}

function validateNonEmptyContent(content, filepath) {
  if (content.length === 0) {
    throw Error("Content must not be empty, however not true for " + filepath);
  }
}
