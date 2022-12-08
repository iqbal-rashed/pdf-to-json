const router = require("express").Router();
const multer = require("multer");
const { StatusError } = require("../utils");
const ExtractPdf = require("../utils/ExtractPdf");
const TextToJson = require("../utils/TextToJson");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/pdf-extract", upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) throw StatusError("File not found");
        const pdfBuffer = req.file.buffer;

        const extractPdf = new ExtractPdf(pdfBuffer);
        const images = await extractPdf.extractImages();
        const text = await extractPdf.extractText();

        const textToJson = new TextToJson(text);

        const details = textToJson.getDetails();

        res.status(200).send({
            ...details,
            // images: {
            //     profile: images[0],
            //     signature: images[1],
            // },
        });
    } catch (err) {
        console.log(err);
        res.status(err.status || 500).send(
            err.message || "Something went wrong!"
        );
    }
});

module.exports = router;
