import { useEffect, useRef } from "react";

const codeSnippets = [
  "const app = express();",
  "import React from 'react';",
  "function deploy() {",
  "git push origin main",
  "npm install",
  "export default App;",
  "return <div>",
  "async function fetch()",
  "useState(false);",
  "console.log('Hello');",
  "interface User {",
  "type Props = {",
  "const [data, setData]",
  "useEffect(() => {",
  "router.get('/')",
  "db.query(sql)",
  "res.json(data)",
  "try { await",
  ".then(res =>",
  "module.exports",
  "<Component />",
  "className={cn(",
  "onClick={() =>",
  "key={item.id}",
  "flex items-center",
  "border-border",
  "rounded-xl p-4",
];

interface CodeLine {
  x: number;
  y: number;
  speed: number;
  text: string;
  opacity: number;
  fontSize: number;
}

const CodeRainBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lines: CodeLine[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initLines();
    };

    const initLines = () => {
      const count = Math.floor(canvas.width / 80);
      lines = Array.from({ length: count }, () => createLine(true));
    };

    const createLine = (randomY: boolean): CodeLine => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -20,
      speed: 0.3 + Math.random() * 0.7,
      text: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
      opacity: 0.06 + Math.random() * 0.12,
      fontSize: 11 + Math.floor(Math.random() * 5),
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "12px 'JetBrains Mono', monospace";

      for (const line of lines) {
        ctx.globalAlpha = line.opacity;
        ctx.fillStyle = `hsl(210, 100%, 55%)`;
        ctx.font = `${line.fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(line.text, line.x, line.y);

        line.y += line.speed;

        if (line.y > canvas.height + 20) {
          Object.assign(line, createLine(false));
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default CodeRainBackground;
