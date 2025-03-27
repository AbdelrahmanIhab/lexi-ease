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
                setTextContent('');
            } else if (selectedFile.type.includes('wordprocessingml.document') || fileExtension === 'docx') {
                await extractDocxText(selectedFile);
            } else if (selectedFile.type === 'text/plain' || fileExtension === 'txt') {
                extractTextFile(selectedFile);
            }
        } catch (error) {
            console.error('Error processing file:', error);
        }
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
        <div className="file-previewer">
            <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
            />

            {file && (
                <div className="preview-container">
                    {file.type === 'application/pdf' && (
                        <div>
                            <Document
                                file={file}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                onLoadError={(error) => console.error('Failed to load PDF:', error)}
                            >
                                <Page pageNumber={pageNumber} />
                            </Document>
                            <div>
                                <button
                                    onClick={() => setPageNumber(pageNumber - 1)}
                                    disabled={pageNumber <= 1}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPageNumber(pageNumber + 1)}
                                    disabled={pageNumber >= numPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {(file.type === 'text/plain' || file.type.includes('document')) && (
                        <div className="text-preview">
                            <h3>Extracted Text:</h3>
                            <pre>{textContent}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilePreviewer;
