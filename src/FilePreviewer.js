import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Document as DocxDocument } from 'docx';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const FilePreviewer = () => {
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

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
        const doc = await DocxDocument.load(arrayBuffer);
        setTextContent(doc.text);
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
                <div className="col-md-6">
                    <input
                        type="file"
                        className="form-control mb-3"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                    />

                    {file && (
                        <div className="card p-3 mb-3">
                            {file.type === 'application/pdf' && (
                                <div>
                                    <Document
                                        file={file}
                                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                        onLoadError={(error) => console.error('Failed to load PDF:', error)}
                                    >
                                        <Page pageNumber={pageNumber} />
                                    </Document>
                                    <div className="d-flex justify-content-center mt-2">
                                        <button
                                            className="btn btn-secondary mx-1"
                                            onClick={() => setPageNumber(pageNumber - 1)}
                                            disabled={pageNumber <= 1}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            className="btn btn-secondary mx-1"
                                            onClick={() => setPageNumber(pageNumber + 1)}
                                            disabled={pageNumber >= numPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(file.type === 'text/plain' || file.type.includes('document')) && (
                                <div className="text-preview mt-3">
                                    <h3 className="mb-2">Extracted Text:</h3>
                                    <pre className="bg-light p-2">{textContent}</pre>
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
