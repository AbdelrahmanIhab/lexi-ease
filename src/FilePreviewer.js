import React, { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import * as mammoth from "mammoth";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const FilePreviewer = () => {
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState([]);
    const [font, setFont] = useState("Lexend");
    const [fontSize, setFontSize] = useState(18);
    const [pageNumber, setPageNumber] = useState(1);
    const [numPages, setNumPages] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [showPdfPreview, setShowPdfPreview] = useState(true);
    const [showExtractedText, setShowExtractedText] = useState(true);

    const dyslexiaFonts = [
        "Lexend", "OpenDyslexic", "Dyslexie", "Comic Sans MS",
        "Arial", "Verdana", "Tahoma", "Courier New",
        "Trebuchet MS", "Georgia", "Times New Roman"
    ];

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
        setFile(selectedFile);

        try {
            if (selectedFile.type === "application/pdf" || fileExtension === "pdf") {
                await extractPdfText(selectedFile);
            } else if (selectedFile.type.includes("wordprocessingml.document") || fileExtension === "docx") {
                await extractDocxText(selectedFile);
            } else if (selectedFile.type === "text/plain" || fileExtension === "txt") {
                extractTextFile(selectedFile);
            }
        } catch (error) {
            console.error("Error processing file:", error);
        }
    };

    const extractPdfText = useCallback(async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument(arrayBuffer).promise;
            let extractedText = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                // Use layout extraction mode to preserve formatting
                const content = await page.getTextContent({ normalizeWhitespace: false });

                // Process text with position information to maintain layout
                const textItems = content.items;
                const viewport = page.getViewport({ scale: 1.0 });
                const pageHeight = viewport.height;

                // Sort text by vertical position (top to bottom)
                textItems.sort((a, b) => {
                    // Get y-position (inverted because PDF coordinates start from bottom)
                    const yA = pageHeight - a.transform[5];
                    const yB = pageHeight - b.transform[5];

                    // If on same line (within threshold), sort by x position
                    if (Math.abs(yA - yB) < 5) {
                        return a.transform[4] - b.transform[4];
                    }
                    return yA - yB;
                });

                // Group text items by lines
                let lines = [];
                let currentLine = [];
                let lastY = null;

                for (const item of textItems) {
                    const y = pageHeight - item.transform[5];

                    // If new line detected
                    if (lastY !== null && Math.abs(y - lastY) > 5) {
                        lines.push(currentLine);
                        currentLine = [];
                    }

                    currentLine.push(item);
                    lastY = y;
                }

                // Add the last line
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }

                // Convert lines to formatted text
                let formattedText = lines.map(line => {
                    // Sort items in line by x position
                    line.sort((a, b) => a.transform[4] - b.transform[4]);

                    // Build line text with appropriate spacing
                    let lineText = "";
                    let lastX = 0;

                    for (const item of line) {
                        const x = item.transform[4];
                        const text = item.str;

                        // Add appropriate spacing based on position difference
                        if (lineText) {
                            const spaceWidth = 4; // Approximate space width
                            const spacesToAdd = Math.max(0, Math.round((x - lastX) / spaceWidth) - 1);
                            lineText += " ".repeat(spacesToAdd);
                        }

                        lineText += text;
                        lastX = x + (text.length * item.width / text.length);
                    }

                    return lineText;
                }).join("\n");

                extractedText.push(formattedText);
            }

            setTextContent(extractedText);
            setNumPages(pdf.numPages);
        } catch (error) {
            console.error("Error extracting PDF text:", error);
        }
    }, []);

    const extractDocxText = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            setTextContent([result.value]);
            setNumPages(1);
        } catch (error) {
            console.error("Error extracting DOCX text:", error);
        }
    };

    const extractTextFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => setTextContent([e.target.result]);
        reader.readAsText(file);
        setNumPages(1);
    };

    const resetFile = () => {
        setFile(null);
        setTextContent([]);
        setNumPages(null);
        setPageNumber(1);
        setShowPdfPreview(true);
        setShowExtractedText(true);
    };

    const goToPreviousPage = () => {
        if (pageNumber > 1) {
            setPageNumber(pageNumber - 1);
        }
    };

    const goToNextPage = () => {
        if (pageNumber < numPages) {
            setPageNumber(pageNumber + 1);
        }
    };

    const goToFirstPage = () => {
        setPageNumber(1);
    };

    const goToLastPage = () => {
        setPageNumber(numPages);
    };

    const handlePageChange = (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= numPages && !isNaN(page)) {
            setPageNumber(page);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <h1 style={styles.title}>LexiEase</h1>
                <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    style={styles.fileInput}
                />

                {file && (
                    <div style={styles.buttonContainer}>
                        <button onClick={() => setShowPdfPreview(!showPdfPreview)} style={styles.button}>
                            {showPdfPreview ? "Hide PDF Preview" : "Show PDF Preview"}
                        </button>
                        <button onClick={() => setShowExtractedText(!showExtractedText)} style={styles.button}>
                            {showExtractedText ? "Hide Extracted Text" : "Show Extracted Text"}
                        </button>
                        <button onClick={resetFile} style={{ ...styles.button, backgroundColor: "#d9534f" }}>
                            Reset
                        </button>
                    </div>
                )}

                {file && (
                    <>
                        <div style={styles.controls}>
                            <label style={styles.label}>Font:</label>
                            <select value={font} onChange={(e) => setFont(e.target.value)} style={styles.select}>
                                {dyslexiaFonts.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <label style={styles.label}>Font Size:</label>
                            <input
                                type="number"
                                value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                min="12"
                                max="36"
                                style={styles.input}
                            />

                            <label style={styles.label}>Zoom:</label>
                            <input
                                type="range"
                                min="1"
                                max="2"
                                step="0.1"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                style={styles.slider}
                            />
                        </div>

                        {numPages > 0 && (
                            <div style={styles.pageNavigation}>
                                <button
                                    onClick={goToFirstPage}
                                    style={styles.navButton}
                                    disabled={pageNumber === 1}
                                >
                                    First
                                </button>
                                <button
                                    onClick={goToPreviousPage}
                                    style={styles.navButton}
                                    disabled={pageNumber === 1}
                                >
                                    Previous
                                </button>
                                <span style={styles.pageInfo}>
                                    <input
                                        type="number"
                                        min="1"
                                        max={numPages}
                                        value={pageNumber}
                                        onChange={handlePageChange}
                                        style={styles.pageInput}
                                    />
                                    {" / "}
                                    {numPages}
                                </span>
                                <button
                                    onClick={goToNextPage}
                                    style={styles.navButton}
                                    disabled={pageNumber === numPages}
                                >
                                    Next
                                </button>
                                <button
                                    onClick={goToLastPage}
                                    style={styles.navButton}
                                    disabled={pageNumber === numPages}
                                >
                                    Last
                                </button>
                            </div>
                        )}

                        <div style={styles.contentContainer}>
                            {showPdfPreview && (
                                <div style={styles.pdfSection}>
                                    <h3>PDF Preview:</h3>
                                    <Document
                                        file={file}
                                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    >
                                        <Page
                                            pageNumber={pageNumber}
                                            scale={zoom}
                                            renderTextLayer={false}
                                        />
                                    </Document>
                                </div>
                            )}

                            {showExtractedText && (
                                <div style={styles.textSection}>
                                    <h3>Extracted Text:</h3>
                                    <pre style={{
                                        fontFamily: font,
                                        fontSize: `${fontSize}px`,
                                        lineHeight: "1.6",
                                        whiteSpace: "pre-wrap",
                                        overflowY: "auto",
                                        maxHeight: "600px"
                                    }}>
                                        {textContent[pageNumber - 1] || ""}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ff9a9e, #fad0c4, #fbc2eb)",
        padding: "20px",
    },
    wrapper: {
        maxWidth: "1200px",
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: "15px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        padding: "30px",
        textAlign: "center",
    },
    title: {
        color: "#5A47AB",
        fontWeight: "bold",
        marginBottom: "20px"
    },
    fileInput: {
        padding: "10px",
        borderRadius: "8px",
        border: "2px solid #5A47AB",
        width: "100%"
    },
    buttonContainer: {
        marginTop: "20px",
        display: "flex",
        justifyContent: "space-around"
    },
    button: {
        backgroundColor: "#5A47AB",
        color: "#fff",
        padding: "10px",
        borderRadius: "8px",
        cursor: "pointer",
        border: "none"
    },
    controls: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        marginTop: "20px"
    },
    label: {
        fontWeight: "bold",
        color: "#5A47AB"
    },
    select: {
        padding: "5px",
        borderRadius: "5px"
    },
    input: {
        padding: "5px",
        width: "60px",
        borderRadius: "5px"
    },
    slider: {
        width: "100px"
    },
    pageNavigation: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        marginTop: "20px",
        marginBottom: "20px"
    },
    navButton: {
        backgroundColor: "#5A47AB",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: "5px",
        cursor: "pointer",
        border: "none",
        fontSize: "14px"
    },
    pageInfo: {
        display: "flex",
        alignItems: "center",
        fontWeight: "bold",
        color: "#5A47AB"
    },
    pageInput: {
        width: "50px",
        padding: "5px",
        borderRadius: "5px",
        border: "1px solid #5A47AB",
        textAlign: "center",
        marginRight: "5px"
    },
    contentContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: "20px",
        gap: "20px"
    },
    pdfSection: {
        flex: "1",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        backgroundColor: "#f9f9f9"
    },
    textSection: {
        flex: "1",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        backgroundColor: "#f9f9f9",
        maxHeight: "700px",
        overflow: "hidden"
    }
};

export default FilePreviewer;
