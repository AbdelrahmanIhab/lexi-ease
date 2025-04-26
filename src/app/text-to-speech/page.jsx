"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page as PDFPage, pdfjs } from "react-pdf";
import { FaUpload, FaPlay, FaPause, FaStop } from "react-icons/fa";
import { RefreshCcw } from "lucide-react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function PDFPreviewPage() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const utteranceRef = useRef(null);
  const textRef = useRef(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

 
  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files[0];
    
    if (!uploadedFile) return;
    
    if (uploadedFile.type === "application/pdf") {
      setFile(uploadedFile);
      setCurrentPage(1);
      setError(null);
      setIsLoading(true);
      
      try {
        await extractPdfText(uploadedFile);
      } catch (error) {
        console.error("Error processing PDF:", error);
        setError("Failed to process PDF file");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Please upload a valid PDF file");
      setFile(null);
    }
  };

  // Extract text from PDF
  const extractPdfText = useCallback(async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      
      let extractedText = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent({
          normalizeWhitespace: false,
        });

        const textItems = content.items;
        const textContent = textItems.map(item => item.str).join(' ');
        
        extractedText.push(textContent);
      }

      setTextContent(extractedText);
      setNumPages(pdf.numPages);
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw error;
    }
  }, []);

  // Text-to-speech functions
  const startReading = () => {
    if (!textContent[currentPage - 1] || !synth) return;
    
    // Cancel any ongoing speech
    stopReading();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(textContent[currentPage - 1]);
    utteranceRef.current = utterance;
    
    // Set speech parameters for better experience
    utterance.rate = 0.9; // Slightly slower for better word tracking
    utterance.pitch = 1.0;
    
    // Set up word boundary detection
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Get the word being spoken
        const charIndex = event.charIndex;
        const text = utterance.text;
        
        // Find word boundaries
        let startIndex = charIndex;
        while (startIndex > 0 && !/\s/.test(text[startIndex - 1])) {
          startIndex--;
        }
        
        let endIndex = charIndex;
        while (endIndex < text.length && !/\s/.test(text[endIndex])) {
          endIndex++;
        }
        
        // Extract the current word
        const word = text.substring(startIndex, endIndex);
        
        highlightTextInPDF(word, startIndex);
      }
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      
      // Clear any highlighting
      if (textRef.current) {
        textRef.current.querySelectorAll('.highlight').forEach(el => {
          el.classList.remove('highlight');
        });
      }
    };
    
    // Start speaking
    synth.speak(utterance);
    setIsPlaying(true);
  };
  
  // Function to highlight text in the PDF view
  const highlightTextInPDF = (word, charIndex) => {
    // Wait for next frame to ensure PDF text layer is rendered
    requestAnimationFrame(() => {
      if (!textRef.current) return;
      
      // Find all text spans in the PDF view
      const textElements = textRef.current.querySelectorAll('.react-pdf__Page__textContent span');
      
      // Remove previous highlights
      textRef.current.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
      });
      
      // Find elements that contain the word
      for (const element of textElements) {
        const text = element.textContent;
        if (text.includes(word)) {
          // Add highlight class
          element.classList.add('highlight');
          
          // Scroll to the highlighted element if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    });
  };
  
  const pauseReading = () => {
    if (!synth) return;
    
    if (isPlaying) {
      synth.pause();
    } else {
      synth.resume();
    }
    setIsPlaying(!isPlaying);
  };
  
  const stopReading = () => {
    if (!synth) return;
    
    synth.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(-1);
    
    // Clear any highlighting
    if (textRef.current) {
      textRef.current.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
      });
    }
  };

  // Stop reading when changing pages
  useEffect(() => {
    stopReading();
  }, [currentPage]);
  
  // Clean up speech synthesis when unmounting
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  // Handle document load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Handle document load error
  const onDocumentLoadError = (error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF document");
    setIsLoading(false);
  };

  // Reset file
  const resetFile = () => {
    stopReading();
    setFile(null);
    setTextContent([]);
    setNumPages(null);
    setCurrentPage(1);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Text to Speech PDF Viewer</h1>
      
      {/* File upload section */}
      <div className="mb-8">
        <label 
          htmlFor="pdf-upload" 
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FaUpload className="w-8 h-8 mb-2 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload PDF</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Supports PDF files
            </p>
          </div>
          <input 
            id="pdf-upload" 
            ref={fileInputRef}
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </label>
        
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center my-8">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Processing file, please wait...</p>
        </div>
      )}
      
      {/* PDF preview with TTS controls */}
      {file && !isLoading && (
        <div className="mb-8">
          {/* Controls for PDF */}
          <div className="flex justify-between mb-4">
            <button
              onClick={resetFile}
              className="flex items-center gap-1 px-4 py-2 bg-purple-400 text-white rounded-md hover:bg-purple-500"
            >
              <RefreshCcw className="w-4 h-4" />
              Reset
            </button>
            
            {/* TTS Controls */}
            <div className="flex space-x-2">
              <button
                onClick={startReading}
                disabled={isPlaying || !textContent[currentPage - 1]}
                className="p-2 bg-green-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Start Reading"
              >
                <FaPlay className="w-4 h-4" />
              </button>
              <button
                onClick={pauseReading}
                disabled={!isPlaying}
                className="p-2 bg-yellow-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isPlaying ? "Pause Reading" : "Resume Reading"}
              >
                <FaPause className="w-4 h-4" />
              </button>
              <button
                onClick={stopReading}
                disabled={!isPlaying}
                className="p-2 bg-red-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Stop Reading"
              >
                <FaStop className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* PDF Document */}
          <div className="border rounded-lg p-4 bg-white">
            <div ref={textRef} className="relative">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                className="flex flex-col items-center"
              >
                <PDFPage 
                  pageNumber={currentPage} 
                  width={550} 
                  renderTextLayer={true} 
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
            
            {numPages && (
              <div className="flex items-center justify-between mt-4">
                <button 
                  onClick={goToPrevPage} 
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                
                <p className="text-center text-gray-600">
                  Page {currentPage} of {numPages}
                </p>
                
                <button 
                  onClick={goToNextPage} 
                  disabled={currentPage >= numPages}
                  className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add CSS for highlighting */}
      <style jsx global>{`
        .highlight {
          background-color: #ffff00;
          border-radius: 2px;
          padding: 0 2px;
          margin: 0 -2px;
        }
        
        .react-pdf__Page__textContent {
          user-select: text !important;
          opacity: 1 !important;
        }
        
        .react-pdf__Page__textContent span {
          color: transparent;
          position: relative;
        }
        
        .react-pdf__Page__textContent span.highlight {
          color: black !important;
          background-color: #ffff00 !important;
        }
      `}</style>
    </div>
  );
}