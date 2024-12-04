import puppeteer from "puppeteer";
import { readdir, mkdir } from "node:fs/promises";

const template = await Bun.file("tools/og.html").text();

const browser = await puppeteer.launch();

async function og(
	postname: string,
	type: string,
	outputPath: string,
	width = 1200,
	height = 630,
) {
	const page = await browser.newPage();

	await page.setViewport({ width, height });

	await page.setContent(
		template
			.toString()
			.replace("{{postname}}", postname)
			.replace("{{type}}", type),
	);

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
		file.endsWith("index.html"),
	);

	const directories = new Set(
		files.map((file) => file.replace("index.html", "")),
	);

	const existing = (await readdir("static/")).filter((file) =>
		directories.has(file),
	);

	// create not existing
	for (const dir of directories) {
		if (!existing.includes(dir)) {
			await mkdir(`static/${dir.split("/").slice(0, -1).join("/")}`, {
				recursive: true,
			});
		}
	}

	console.log("Generating OG images for", files.length, "files");

	// for each file, get the title tag from the index.html
	for (const file of files) {
		const index = await Bun.file(`public/${file}`).text();
		const title = index.match(/<title>(.*?)<\/title>/)[1];
		let type = "Page";
		switch (file.split("/")[0]) {
			case "blog":
				type = "Blog";
				break;
			case "verify":
			case "pfp":
				type = "Slash Page";
				break;
			case "tags":
				if (file.split("/")[1] === "index.html") {
					type = "Tags";
				} else {
					type = "Tag";
				}
				break;
			case "index.html":
				type = "Root";
				break;
		}

		console.log("Generating OG for", file, "title:", title, "with type:", type);
		await og(title, type, `static/${file.replace("index.html", "og.png")}`);
	}
} catch (e) {
	console.error(e);
} finally {
	await browser.close();
}
