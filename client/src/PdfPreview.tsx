import { useEffect, useRef } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

export function PdfPreview({ pdfUrl }: { pdfUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderToken = 0;

    async function render() {
      const container = containerRef.current;
      if (!container) return;

      const token = ++renderToken;
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      if (cancelled || token !== renderToken) {
        await loadingTask.destroy();
        return;
      }

      container.replaceChildren();
      const width = Math.max(container.clientWidth - 32, 200);
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || token !== renderToken) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = width / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const wrapper = document.createElement("div");
        wrapper.className = "preview-page";
        const context = canvas.getContext("2d");
        if (!context) continue;
        canvas.className = "preview-canvas";
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        wrapper.appendChild(canvas);
        container.appendChild(wrapper);
        await page.render({ canvasContext: context, canvas, viewport }).promise;
      }
    }

    render().catch((error) => {
      const container = containerRef.current;
      if (!cancelled && container) {
        container.replaceChildren();
        const pre = document.createElement("pre");
        pre.className = "preview-render-error";
        pre.textContent = String(error);
        container.appendChild(pre);
      }
    });

    const observer = new ResizeObserver(() => {
      render().catch(() => {});
    });
    const observedContainer = containerRef.current;
    if (observedContainer) observer.observe(observedContainer);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pdfUrl]);

  return <div ref={containerRef} className="preview-document" />;
}
