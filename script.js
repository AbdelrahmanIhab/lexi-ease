// PDF.js config
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

const highlights = [];
let pdfText = '';

// 1. PDF Upload Handler
document.getElementById('pdf-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  
  // Extract text from all pages
  pdfText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    pdfText += textContent.items.map(item => item.str).join(' ');
  }
  
  renderText();
});

// 2. Highlight Button
document.getElementById('highlight-btn').addEventListener('click', () => {
  const selection = window.getSelection();
  if (!selection.toString()) return;

  const range = selection.getRangeAt(0);
  const color = document.getElementById('color-picker').value;

  highlights.push({
    start: range.startOffset,
    end: range.endOffset,
    color
  });

  renderText();
});

// 3. Render Text with Highlights
function renderText() {
  const viewer = document.getElementById('pdf-viewer');
  let html = '';
  let lastPos = 0;

  highlights.sort((a, b) => a.start - b.start).forEach(hl => {
    // Text before highlight
    if (hl.start > lastPos) {
      html += pdfText.slice(lastPos, hl.start);
    }
    
    // Highlighted text
    html += `<span style="background-color: ${hl.color}">${pdfText.slice(hl.start, hl.end)}</span>`;
    lastPos = hl.end;
  });

  // Remaining text
  if (lastPos < pdfText.length) {
    html += pdfText.slice(lastPos);
  }

  viewer.innerHTML = html;
}