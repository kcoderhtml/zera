import puppeteer from "puppeteer";

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

try {
  await og("an early tale of tomfoolery", "og.png");
} catch (e) {
  console.error(e);
} finally {
  await browser.close();
}
