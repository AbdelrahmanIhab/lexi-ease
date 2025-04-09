"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import * as mammoth from "mammoth";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCcw, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const readPageFlag = false;

const FilePreviewer = () => {
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [font, setFont] = useState("Lexend");
  const [fontSize, setFontSize] = useState(18);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const [showExtractedText, setShowExtractedText] = useState(true);
  const [highlightColor, setHighlightColor] = useState("#FFFF00"); // Default yellow highlight
  const [selectedText, setSelectedText] = useState("");
  const [customColor, setCustomColor] = useState("#FFFF00");
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Text-to-speech states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [speechVoice, setSpeechVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const speechSynthRef = useRef(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  const fileInputRef = useRef(null);

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
    "Times New Roman",
  ];

  const highlightColors = [
    { name: "Yellow", value: "#FFFF00" },
    { name: "Green", value: "#90EE90" },
    { name: "Pink", value: "#FFB6C1" },
    { name: "Blue", value: "#ADD8E6" },
    { name: "Orange", value: "#FFD580" },
    { name: "Purple", value: "#D8BFD8" },
    { name: "Cyan", value: "#E0FFFF" },
    { name: "Lime", value: "#CCFF00" },
    { name: "Coral", value: "#FF7F50" },
    { name: "Lavender", value: "#E6E6FA" },
    { name: "Custom", value: "custom" },
  ];

  useEffect(() => {
    const spinnerStyle = document.createElement("style");
    spinnerStyle.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);

    return () => {
      document.head.removeChild(spinnerStyle);
    };
  }, []);

  // Load dyslexia-friendly fonts
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Load the font stylesheets
    const linkLexend = document.createElement("link");
    linkLexend.href =
      "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;700&display=swap";
    linkLexend.rel = "stylesheet";
    document.head.appendChild(linkLexend);

    // Load Dyslexie font using @font-face
    const dyslexieStyle = document.createElement("link");
    dyslexieStyle.textContent = `
            @font-face {
                font-family: 'Dyslexie';
                src: url('https://cdn.jsdelivr.net/npm/@fontsource/dyslexie@4.5.0/files/dyslexie-latin-400-normal.woff2') format('woff2');
                font-weight: normal;
                font-style: normal;
            }
        `;
    document.head.appendChild(dyslexieStyle);

    // Set fonts as loaded
    setFontsLoaded(true);

    // Cleanup function
    return () => {
      document.head.removeChild(linkLexend);
      document.head.removeChild(dyslexieStyle);
    };
  }, []);

  // Monitor font changes to preload OpenDyslexic when selected
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (font === "OpenDyslexic") {
      // Force a font load by creating a hidden element with the font
      const preloadElement = document.createElement("div");
      preloadElement.style.fontFamily = "'OpenDyslexic', sans-serif";
      preloadElement.style.visibility = "hidden";
      preloadElement.style.position = "absolute";
      preloadElement.textContent = "Font Preload";
      document.body.appendChild(preloadElement);

      return () => {
        document.body.removeChild(preloadElement);
      };
    }
  }, [font]);

  // Initialize speech synthesis and get available voices
  useEffect(() => {
    if (typeof window === "undefined") return;

    const synth = speechSynthRef.current;
    if (!synth) return;

    // Function to load and set available voices
    const loadVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0) {
        setSpeechVoice(voices[0]);
      }
    };

    // Load voices initially
    loadVoices();

    // Some browsers (like Chrome) load voices asynchronously
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    // Clean up on component unmount
    return () => {
      if (isSpeaking && synth) {
        synth.cancel();
      }
    };
  }, []);

  // Handle text-to-speech speaking
  const speakText = () => {
    const synth = speechSynthRef.current;

    // Cancel any ongoing speech
    synth.cancel();

    // Get clean text (without HTML tags) from current page
    const currentText = textContent[pageNumber - 1];
    if (!currentText) return;

    // Create a temporary element to strip HTML tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = currentText;
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Set speech settings
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    if (speechVoice) {
      utterance.voice = speechVoice;
    }

    // Handle speech events
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
    };

    // Start speaking
    synth.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    const synth = speechSynthRef.current;
    synth.cancel();
    setIsSpeaking(false);
  };

  // Play selected text only
  const speakSelectedText = () => {
    if (!selectedText) return;

    const synth = speechSynthRef.current;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    if (speechVoice) {
      utterance.voice = speechVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    setFile(selectedFile);
    setIsLoading(true);

    try {
      if (selectedFile.type === "application/pdf" || fileExtension === "pdf") {
        await extractPdfText(selectedFile);
      } else if (
        selectedFile.type.includes("wordprocessingml.document") ||
        fileExtension === "docx"
      ) {
        await extractDocxText(selectedFile);
      } else if (
        selectedFile.type === "text/plain" ||
        fileExtension === "txt"
      ) {
        extractTextFile(selectedFile);
      }
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsLoading(false);
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
        const content = await page.getTextContent({
          normalizeWhitespace: false,
        });

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
        let formattedText = lines
          .map((line) => {
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
                const spacesToAdd = Math.max(
                  0,
                  Math.round((x - lastX) / spaceWidth) - 1
                );
                lineText += " ".repeat(spacesToAdd);
              }

              lineText += text;
              lastX = x + (text.length * item.width) / text.length;
            }

            return lineText;
          })
          .join("\n");

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
    reader.onload = (e) => {
      setTextContent([e.target.result]);
      setNumPages(1);
      setIsLoading(false);
    };
    reader.onerror = () => {
      console.error("Error reading text file");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const resetFile = () => {
    setFile(null);
    setTextContent([]);
    setNumPages(null);
    setPageNumber(1);
    setShowPdfPreview(true);
    setShowExtractedText(true);
    stopSpeaking();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const goToPreviousPage = () => {
    if (pageNumber > 1) {
      stopSpeaking();
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      stopSpeaking();
      setPageNumber(pageNumber + 1);
    }
  };

  const goToFirstPage = () => {
    stopSpeaking();
    setPageNumber(1);
  };

  const goToLastPage = () => {
    stopSpeaking();
    setPageNumber(numPages);
  };

  const handlePageChange = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= numPages && !isNaN(page)) {
      stopSpeaking();
      setPageNumber(page);
    }
  };

  // Highlight text selection function
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== "") {
      setSelectedText(selection.toString());
    }
  };

  // Apply highlight to selected text
  const applyHighlight = () => {
    if (!selectedText) return;

    const currentText = textContent[pageNumber - 1];
    if (!currentText) return;

    // Create a highlighted version of the text by wrapping the selected text with a span
    const regex = new RegExp(
      `(${selectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "g"
    );

    // Use custom color if that option is selected
    const colorToUse =
      highlightColor === "custom" ? customColor : highlightColor;

    console.log(colorToUse);

    // We need to handle the text content as HTML now
    const updatedTextContent = [...textContent];
    updatedTextContent[pageNumber - 1] = currentText.replace(
      regex,
      `<span style="background-color: ${colorToUse};">$1</span>`
    );

    setTextContent(updatedTextContent);
    setSelectedText("");
  };

  // Remove all highlights - Fixed the issue by correctly parsing HTML content
  const removeHighlights = () => {
    const currentText = textContent[pageNumber - 1];
    if (!currentText) return;

    // Use a more robust method to remove spans with background color
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<div>${currentText}</div>`,
      "text/html"
    );

    // Find all spans with background-color style
    const spans = doc.querySelectorAll('span[style*="background-color"]');

    // Replace each span with its text content
    spans.forEach((span) => {
      const textNode = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(textNode, span);
    });

    // Get the clean HTML content
    const cleanText = doc.querySelector("div").innerHTML;

    const updatedTextContent = [...textContent];
    updatedTextContent[pageNumber - 1] = cleanText;

    setTextContent(updatedTextContent);
  };

  const handleColorChange = (selectedValue) => {
    setHighlightColor(selectedValue);
  };

  // Function to apply the appropriate font family CSS
  const getFontFamilyStyle = (fontName) => {
    switch (fontName) {
      case "OpenDyslexic":
        return "'OpenDyslexic', sans-serif";
      //   case "Dyslexie":
      //     return "'Dyslexie', sans-serif";
      case "Lexend":
        return "'Lexend', sans-serif";
      default:
        return fontName;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h1 style={styles.title}>LexiEase</h1>
        {/* <Input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          // style={styles.fileInput}
        /> */}
        <Card className="p-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors">
              <label className="flex flex-col items-center gap-2 cursor-pointer w-full text-center">
                <Upload className="h-8 w-8 text-gray-500" />
                {/* <span className="text-sm font-medium">
                  {fileName ? fileName : "Choose a file or drag and drop here"}
                </span> */}
                <span className="text-xs text-gray-500">
                  Supports PDF, DOCX, and TXT files
                </span>
                <Input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
            </div>
            {/* <Button
              type="button"
              variant="outline"
              onClick={() =>
                document.querySelector('input[type="file"]')?.click()
              }
              className="w-full sm:w-auto"
            >
              Browse Files
            </Button> */}
          </div>
        </Card>

        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Processing file, please wait...</p>
          </div>
        )}

        {file && (
          <div style={styles.buttonContainer} className="w-full gap-2">
            <button
              onClick={() => setShowPdfPreview(!showPdfPreview)}
              style={styles.button}
              className="w-full"
            >
              {showPdfPreview ? "Hide PDF Preview" : "Show PDF Preview"}
            </button>

            <button
              onClick={() => setShowExtractedText(!showExtractedText)}
              style={styles.button}
              className="w-full"
            >
              {showExtractedText
                ? "Hide Extracted Text"
                : "Show Extracted Text"}
            </button>
            <button
              onClick={resetFile}
              style={{ ...styles.button }}
              className="flex flex-row justify-center items-center bg-purple-400 gap-1"
            >
              <RefreshCcw className="size-4" />
              Reset
            </button>
          </div>
        )}

        {file && (
          <>
            <div style={styles.controls} className="w-full gap-2">
              <div className="grid grid-cols-full gap-4 w-full p-4 rounded-lg bg-purple-950/20">
                <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Font Family
                    </label>
                    <Select value={font} onValueChange={setFont}>
                      <SelectTrigger className="w-full border-gray-500 text-black">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {dyslexiaFonts.map((f) => (
                          <SelectItem key={f} value={f} className="text-black">
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-full">
                    <label className="text-sm font-medium text-gray-700">
                      Zoom Level
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>100%</span>
                      <span>{(zoom * 100).toFixed(0)}%</span>
                      <span>200%</span>
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="text-sm font-medium text-gray-700">
                      Font Size
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="36"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>12px</span>
                      <span>{fontSize}px</span>
                      <span>36px</span>
                    </div>
                  </div>
                </div>
              </div>
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

            {/* Text-to-Speech Controls */}
            {readPageFlag && showExtractedText && textContent.length > 0 && (
              <div style={styles.ttsControls}>
                <label style={styles.label}>Voice:</label>
                <select
                  value={availableVoices.indexOf(speechVoice)}
                  onChange={(e) =>
                    setSpeechVoice(availableVoices[e.target.value])
                  }
                  style={styles.select}
                  className="text-black"
                >
                  {availableVoices.map((voice, index) => (
                    <option key={index} value={index} className="text-black">
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>

                <label style={styles.label}>Speed:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  style={styles.slider}
                />
                <span>{speechRate.toFixed(1)}x</span>

                <label style={styles.label}>Pitch:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  style={styles.slider}
                />
                <span>{speechPitch.toFixed(1)}</span>

                <div style={styles.ttsButtons}>
                  {!isSpeaking ? (
                    <button
                      onClick={speakText}
                      style={{ ...styles.button, backgroundColor: "#4CAF50" }}
                    >
                      Read Page
                    </button>
                  ) : (
                    <button
                      onClick={stopSpeaking}
                      style={{ ...styles.button, backgroundColor: "#f0ad4e" }}
                    >
                      Stop Reading
                    </button>
                  )}

                  <button
                    onClick={speakSelectedText}
                    style={{ ...styles.button, marginLeft: "10px" }}
                    disabled={!selectedText}
                  >
                    Read Selection
                  </button>
                </div>
              </div>
            )}

            {showExtractedText && (
              <div className="w-full p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row w-full gap-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Highlight Color:
                    </label>
                    <div className="w-full flex gap-2 items-center">
                      <Select
                        value={highlightColor}
                        onValueChange={handleColorChange}
                      >
                        <SelectTrigger className="w-full bg-white text-gray-800 border-gray-300 focus:ring-2 focus:ring-gray-200">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          {highlightColors.map((color) => (
                            <SelectItem
                              key={color.value}
                              value={color.value}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor:
                                    color.value !== "custom"
                                      ? color.value
                                      : customColor,
                                }}
                              />
                              <span>{color.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {highlightColor === "custom" && (
                        <div className="relative">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border border-gray-300 p-1"
                          />
                          <div className="absolute inset-0 opacity-0">
                            <input
                              type="color"
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                              className="w-full h-full cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:justify-end">
                    <button
                      onClick={applyHighlight}
                      disabled={!selectedText}
                      className={`px-4 py-2 rounded-md text-white font-medium transition-colors w-full sm:w-auto
              ${
                !selectedText
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
              }`}
                    >
                      Highlight Selection
                    </button>
                    <button
                      onClick={removeHighlights}
                      className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium transition-colors w-full sm:w-auto"
                    >
                      Remove Highlights
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.contentContainer}>
              {showPdfPreview && file.type === "application/pdf" && (
                <div style={styles.pdfSection} className="text-black">
                  <div className="flex items-center justify-center bg-purple-950/20 p-2 rounded-md mb-2">
                    <h3>PDF Preview</h3>
                  </div>
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
                <div style={styles.textSection} className="text-black">
                  <div className="flex items-center justify-center bg-purple-950/20 p-2 rounded-md mb-2">
                    <h3>Extracted Text</h3>
                  </div>
                  <pre
                    style={{
                      fontFamily: getFontFamilyStyle(font),
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                      overflowY: "auto",
                      maxHeight: "600px",
                    }}
                    onMouseUp={handleTextSelection}
                    dangerouslySetInnerHTML={{
                      __html: textContent[pageNumber - 1] || "",
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Font information section */}
        <div style={styles.fontInfoSection}>
          <h3>About Dyslexia-Friendly Fonts</h3>
          <div style={styles.fontInfoGrid} className="text-black">
            <div style={styles.fontCard}>
              <h4
                style={{ fontFamily: getFontFamilyStyle("Lexend") }}
                className="text-xl font-semibold"
              >
                Lexend
              </h4>
              <p>
                A font designed to reduce cognitive load and increase reading
                speed. It features expanded spacing and simplified letterforms.
              </p>
            </div>
            <div style={styles.fontCard}>
              <h4
                style={{ fontFamily: getFontFamilyStyle("OpenDyslexic") }}
                className="text-xl font-semibold"
              >
                OpenDyslexic
              </h4>
              <p>
                A free font with bottom-weighted characters that help prevent
                letters from flipping and swapping.
              </p>
            </div>
            <div style={styles.fontCard}>
              <h4
                /*style={{ fontFamily: getFontFamilyStyle("Dyslexie") }}*/ className="text-xl font-semibold"
              >
                Dyslexie
              </h4>
              <p>
                A specialized font designed to improve readability for people
                with dyslexia by making each letter more distinctive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    // minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // background: "linear-gradient(135deg, #ff9a9e, #fad0c4, #fbc2eb)",
    paddingRight: "20px",
    paddingLeft: "20px",
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
    fontSize: "24px",
    marginBottom: "20px",
  },
  fileInput: {
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid #5A47AB",
    color: "#5A47AB",
    width: "100%",
  },
  buttonContainer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-around",
  },
  button: {
    backgroundColor: "#5A47AB",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    border: "none",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "20px",
  },
  ttsControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#f0f8ff",
    borderRadius: "8px",
    flexWrap: "wrap",
  },
  ttsButtons: {
    display: "flex",
    marginLeft: "auto",
  },
  highlightControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "20px",
    flexWrap: "wrap",
  },
  label: {
    fontWeight: "bold",
    color: "#5A47AB",
  },
  select: {
    padding: "5px",
    borderRadius: "5px",
  },
  input: {
    padding: "5px",
    width: "60px",
    borderRadius: "5px",
  },
  colorPicker: {
    width: "40px",
    height: "30px",
    border: "none",
    cursor: "pointer",
  },
  slider: {
    width: "100px",
  },
  pageNavigation: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  navButton: {
    backgroundColor: "#5A47AB",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    border: "none",
    fontSize: "14px",
  },
  pageInfo: {
    display: "flex",
    alignItems: "center",
    fontWeight: "bold",
    color: "#5A47AB",
  },
  pageInput: {
    width: "50px",
    padding: "5px",
    borderRadius: "5px",
    border: "1px solid #5A47AB",
    textAlign: "center",
    marginRight: "5px",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "20px",
    gap: "20px",
  },
  pdfSection: {
    flex: "1",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
  },
  textSection: {
    flex: "1",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    maxHeight: "700px",
    overflow: "hidden",
  },
  fontInfoSection: {
    marginTop: "30px",
    padding: "20px",
    borderTop: "1px solid #ddd",
  },
  fontInfoGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: "20px",
    marginTop: "15px",
  },
  fontCard: {
    width: "30%",
    minWidth: "250px",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(0, 0, 0, 0.1)",
    borderTop: "4px solid #5A47AB",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// Add CSS animation for the spinner
// const spinnerStyle = document.createElement("style");
// spinnerStyle.textContent = `
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }
// `;
// if (typeof document !== "undefined") {
//   document.head.appendChild(spinnerStyle);
// }

export default FilePreviewer;
