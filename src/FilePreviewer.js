import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as mammoth from 'mammoth';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const FilePreviewer = () => {
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [docxPreview, setDocxPreview] = useState('');
    const [font, setFont] = useState("Lexend");
    const [fontSize, setFontSize] = useState(18);

    const dyslexiaFonts = ["Lexend", "OpenDyslexic", "Dyslexie", "Comic Sans MS", "Arial"];

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        setFile(selectedFile);

        try {
            if (selectedFile.type === 'application/pdf' || fileExtension === 'pdf') {
                await extractPdfText(selectedFile);
            } else if (selectedFile.type.includes('wordprocessingml.document') || fileExtension === 'docx') {
                await extractDocxText(selectedFile);
            } else if (selectedFile.type === 'text/plain' || fileExtension === 'txt') {
                extractTextFile(selectedFile);
            }
        } catch (error) {
            console.error('Error processing file:', error);
        }
    };

    const extractPdfText = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ');
        }

        setTextContent(text);
    };

    const extractDocxText = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        setTextContent(result.value);
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        setDocxPreview(htmlResult.value);
    };

    const extractTextFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => setTextContent(e.target.result);
        reader.readAsText(file);
    };

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">LexiEase</h1>
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <input
                        type="file"
                        className="form-control mb-3"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                    />
                    <div className="mb-3">
                        <label>Font:</label>
                        <select className="form-control" value={font} onChange={(e) => setFont(e.target.value)}>
                            {dyslexiaFonts.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label>Font Size:</label>
                        <input
                            type="number"
                            className="form-control"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value) || 18)}
                        />
                    </div>

                    {file && (
                        <div className="card p-3 mb-3">
                            {/* Extracted Text Section with Custom Font */}
                            {textContent && (
                                <div className="text-preview mt-3"
                                     style={{
                                         fontFamily: font,
                                         fontSize: `${fontSize}px`,
                                         lineHeight: "1.6",
                                     }}>
                                    <h3 className="mb-2">Extracted Text:</h3>
                                    <pre className="bg-light p-2" style={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        maxHeight: '500px',
                                        overflowY: 'auto',
                                        fontFamily: font, // Apply font here
                                        fontSize: `${fontSize}px`, // Apply font size here
                                    }}>
    {textContent}
</pre>

                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewer;
