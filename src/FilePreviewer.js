import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import * as mammoth from "mammoth";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const FilePreviewer = () => {
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState("");
    const [font, setFont] = useState("Lexend");
    const [fontSize, setFontSize] = useState(18);

    const dyslexiaFonts = [
        "Lexend",
        "OpenDyslexic",
        "Dyslexie",
        "Comic Sans MS",
        "Arial",
        "Verdana",
        "Tahoma",
        "Courier New",
        "Trebuchet MS",
        "Georgia",
        "Times New Roman"
    ];


    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
        setFile(selectedFile);

        try {
            if (
                selectedFile.type === "application/pdf" ||
                fileExtension === "pdf"
            ) {
                await extractPdfText(selectedFile);
            } else if (
                selectedFile.type.includes("wordprocessingml.document") ||
                fileExtension === "docx"
            ) {
                await extractDocxText(selectedFile);
            } else if (selectedFile.type === "text/plain" || fileExtension === "txt") {
                extractTextFile(selectedFile);
            }
        } catch (error) {
            console.error("Error processing file:", error);
        }
    };

    const extractPdfText = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ");
        }

        setTextContent(text);
    };

    const extractDocxText = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        setTextContent(result.value);
    };

    const extractTextFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => setTextContent(e.target.result);
        reader.readAsText(file);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #ff9a9e, #fad0c4, #fad0c4, #fbc2eb)",
                padding: "20px",
            }}
        >
            <div
                style={{
                    maxWidth: "700px",
                    width: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "15px",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    padding: "30px",
                    textAlign: "center",
                }}
            >
                <h1 style={{ color: "#5A47AB", fontWeight: "bold", marginBottom: "20px" }}>
                    LexiEase
                </h1>

                <input
                    type="file"
                    className="form-control mb-3"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "2px solid #5A47AB",
                        width: "100%",
                        cursor: "pointer",
                    }}
                />

                <div className="mb-3">
                    <label style={{ fontWeight: "bold", color: "#333" }}>Font:</label>
                    <select
                        className="form-control"
                        value={font}
                        onChange={(e) => setFont(e.target.value)}
                        style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "2px solid #5A47AB",
                            width: "100%",
                            cursor: "pointer",
                        }}
                    >
                        {dyslexiaFonts.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label style={{ fontWeight: "bold", color: "#333" }}>Font Size:</label>
                    <input
                        type="number"
                        className="form-control"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 18)}
                        style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "2px solid #5A47AB",
                            width: "100%",
                        }}
                    />
                </div>

                {file && textContent && (
                    <div
                        style={{
                            marginTop: "20px",
                            padding: "15px",
                            backgroundColor: "#f9f9f9",
                            borderRadius: "10px",
                            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                            textAlign: "left",
                            maxHeight: "400px",
                            overflowY: "auto",
                        }}
                    >
                        <h3 style={{ color: "#5A47AB", fontWeight: "bold" }}>Extracted Text:</h3>
                        <pre
                            style={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontFamily: font,
                                fontSize: `${fontSize}px`,
                                lineHeight: "1.6",
                            }}
                        >
              {textContent}
            </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilePreviewer;
