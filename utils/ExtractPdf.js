const { Poppler } = require("node-poppler");
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
const sharp = require("sharp");
const { OPS } = pdfjs;
const path = require("path");
const os = require("os");
const { spawn, spawnSync } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const fsAsync = require("fs/promises");

const spawnAsync = promisify(spawn);

pdfjs.GlobalWorkerOptions.workerSrc = path.join(
    __dirname,
    "../node_modules/pdfjs-dist/legacy/build/pdf.worker.js"
);

const BIN_PATH = path.join(__dirname, "../bin/linux/pdftotext");

class ExtractPdf {
    constructor(buffer) {
        this.buffer = buffer;
        this.bin_path = BIN_PATH;
        this.file_path = path.join(__dirname, "../temp", "temp.pdf");
        this.text_file = path.join(__dirname, "../temp", "text.txt");
        fs.writeFileSync(this.file_path, buffer);
    }

    async extractImages() {
        const pdf = await pdfjs.getDocument({ data: this.buffer }).promise;
        const pageCount = pdf.numPages;
        const images = [];

        for (let p = 1; p <= pageCount; p++) {
            const page = await pdf.getPage(p);
            const ops = await page.getOperatorList();

            for (let i = 0; i < ops.fnArray.length; i++) {
                if (
                    ops.fnArray[i] === OPS.paintJpegXObject ||
                    ops.fnArray[i] === OPS.paintImageXObject ||
                    ops.fnArray[i] === OPS.paintInlineImageXObject
                ) {
                    const name = ops.argsArray[i][0];
                    const img = await page.objs.get(name);
                    const { width, height, kind } = img;
                    const bytes = img.data.length;
                    const channels = bytes / width / height;

                    const imageBuffer = await sharp(img.data, {
                        raw: { width, height, channels },
                    }).toBuffer();

                    images.push(imageBuffer);
                }
            }
        }

        return images;
    }

    async extractText() {
        await spawnSync(this.bin_path, [
            "-enc",
            "UTF-8",
            "-simple2",
            this.file_path,
            this.text_file,
        ]);
        const text = await fsAsync.readFile(this.text_file, {
            encoding: "utf-8",
        });
        return text;
    }
}

module.exports = ExtractPdf;
