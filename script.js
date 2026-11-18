(() => {
  'use strict';

  // Configure PDF.js worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const PDF_URL = '/documents/document.pdf';
  const container = document.getElementById('viewer-container');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');

  let pdfDoc = null;
  let renderTasks = [];

  /**
   * Cancel any pending page rendering tasks before starting a new render.
   */
  function cancelPendingRenders() {
    renderTasks.forEach(task => {
      if (task && typeof task.cancel === 'function') {
        try {
          task.cancel();
        } catch (_) {}
      }
    });
    renderTasks = [];
  }

  /**
   * Render all pages onto high-DPI canvases sized responsively.
   */
  async function renderPages() {
    if (!pdfDoc) return;

    cancelPendingRenders();
    container.innerHTML = '';

    const dpr = window.devicePixelRatio || 1;
    // Calculate display width: max 900px, responsive down to screen width with 16px margins
    const targetWidth = Math.min(Math.max(window.innerWidth - 32, 280), 900);

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const originalViewport = page.getViewport({ scale: 1 });
        const cssScale = targetWidth / originalViewport.width;
        const scaledViewport = page.getViewport({ scale: cssScale * dpr });

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page';
        canvas.width = Math.floor(scaledViewport.width);
        canvas.height = Math.floor(scaledViewport.height);
        canvas.style.width = `${Math.floor(scaledViewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height / dpr)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        container.appendChild(canvas);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: scaledViewport
        });

        renderTasks.push(renderTask);
        await renderTask.promise;
      } catch (err) {
        if (err && err.name === 'RenderingCancelledException') {
          // Expected when resizing triggered a new render
          return;
        }
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    }
  }

  /**
   * Fetch and initialize the PDF document.
   */
  async function loadDocument() {
    try {
      loadingEl.classList.remove('hidden');
      errorEl.classList.add('hidden');

      const loadingTask = window.pdfjsLib.getDocument(PDF_URL);
      pdfDoc = await loadingTask.promise;

      loadingEl.classList.add('hidden');
      await renderPages();
    } catch (err) {
      console.warn('Unable to load PDF document:', err);
      loadingEl.classList.add('hidden');
      errorEl.classList.remove('hidden');
    }
  }

  // Handle window resizing with debounce
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (pdfDoc) {
        renderPages();
      }
    }, 150);
  });

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDocument);
  } else {
    loadDocument();
  }
})();
