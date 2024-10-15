import puppeteer from "puppeteer";
import { readdir } from "node:fs/promises";

const template = await Bun.file("tools/og.html").text();

const browser = await puppeteer.launch();

async function og(
  postname: string,
  outputPath: string,
  width = 1200,
  height = 630
) {
  const page = await browser.newPage();

  await page.setViewport({ width, height });

  await page.setContent(template.toString().replace("{{postname}}", postname));

  await page.screenshot({ path: outputPath });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Bun.file(path);
    return true;
  } catch (e) {
    return false;
  }
}

try {
  // check if the public/blog folder exists
  // if not exit
  // if it does, get all the folders and then get the title tag from the index.html

  if (!(await fileExists("public/"))) {
    console.error("public/ does not exist");
    process.exit(1);
  }

  // read all the files in the current directory filtering for index.htmls
  const files = (await readdir("public/", { recursive: true })).filter((file) =>
    file.endsWith("index.html")
  );

  console.log("Generating OG images for", files.length, "files");

  // for each file, get the title tag from the index.html
  for (const file of files) {
    const index = await Bun.file(`public/${file}`).text();
    const title = index.match(/<title>(.*?)<\/title>/)![1];
    if (!title) {
      console.error(`No title found for ${file}`);
      continue;
    }
    console.log("Generating OG for", title);
    await og(title, `public/${file.replace("index.html", "og.png")}`);
  }
} catch (e) {
  console.error(e);
} finally {
  await browser.close();
}
