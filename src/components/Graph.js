import React, { useEffect, useRef } from "react";

const NODE_COUNT = 120;
const CONNECTION_DISTANCE = 130;
const SPRING_STRENGTH = 1.0;
const FORCE_MULTIPLIER = 0.08;
const DAMPING = 0.85;
const RANDOM_MOVEMENT = 0.05;
const RESTORE_STRENGTH = 0.05;

// Set header height to match your header.css (175px)
const HEADER_HEIGHT = 175;

const Graph = () => {
  const canvasRef = useRef(null);
  const nodes = useRef([]);
  const mouse = useRef({ x: null, y: null });
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpi = window.devicePixelRatio || 1;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth * dpi;
      canvas.height = HEADER_HEIGHT * dpi;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = HEADER_HEIGHT + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpi, dpi);
      initializeNodes();
    };

    const initializeNodes = () => {
      nodes.current = Array.from({ length: NODE_COUNT }, () => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * HEADER_HEIGHT;
        return { x, y, originalX: x, originalY: y, vx: 0, vy: 0 };
      });
    };

    const trackMouse = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = event.clientX - rect.left;
      mouse.current.y = event.clientY - rect.top;
    };

    const resetMouse = () => {
      mouse.current.x = null;
      mouse.current.y = null;
    };

    const updateNodes = () => {
      // Fill the canvas with your chosen background color
      ctx.fillStyle = "#f9f9f9";
      ctx.fillRect(0, 0, window.innerWidth, HEADER_HEIGHT);

      nodes.current.forEach((node) => {
        if (mouse.current.x !== null && mouse.current.y !== null) {
          const dx = mouse.current.x - node.x;
          const dy = mouse.current.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < CONNECTION_DISTANCE) {
            const force = (SPRING_STRENGTH / (distance + 1)) * FORCE_MULTIPLIER;
            node.vx += dx * force;
            node.vy += dy * force;
          } else {
            const restoreDx = node.originalX - node.x;
            const restoreDy = node.originalY - node.y;
            node.vx += restoreDx * RESTORE_STRENGTH;
            node.vy += restoreDy * RESTORE_STRENGTH;
          }
        } else {
          const restoreDx = node.originalX - node.x;
          const restoreDy = node.originalY - node.y;
          node.vx += restoreDx * RESTORE_STRENGTH;
          node.vy += restoreDy * RESTORE_STRENGTH;
        }

        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.vx += (Math.random() - 0.5) * RANDOM_MOVEMENT;
        node.vy += (Math.random() - 0.5) * RANDOM_MOVEMENT;

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) { node.x = 0; node.vx *= -1; }
        if (node.x > window.innerWidth) { node.x = window.innerWidth; node.vx *= -1; }
        if (node.y < 0) { node.y = 0; node.vy *= -1; }
        if (node.y > HEADER_HEIGHT) { node.y = HEADER_HEIGHT; node.vy *= -1; }

        // Blend node color from gray (180,180,180) to blue (0,122,255) based on proximity to the pointer
        let fillColor = "rgba(180,180,180,0.95)";
        let shadowColor = "rgba(180,180,180,0.8)";
        if (mouse.current.x !== null && mouse.current.y !== null) {
          const dx = mouse.current.x - node.x;
          const dy = mouse.current.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const factor = Math.max(0, Math.min(1, (CONNECTION_DISTANCE - distance) / CONNECTION_DISTANCE));
          const r = Math.round(180 * (1 - factor) + 0 * factor);
          const g = Math.round(180 * (1 - factor) + 122 * factor);
          const b = Math.round(180 * (1 - factor) + 255 * factor);
          fillColor = `rgba(${r},${g},${b},0.95)`;
          shadowColor = `rgba(${r},${g},${b},0.8)`;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      // Draw edges with blended colors based on the pointer's proximity to the connected nodes
      nodes.current.forEach((node) => {
        nodes.current.forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const edgeDist = Math.sqrt(dx * dx + dy * dy);
          if (edgeDist < CONNECTION_DISTANCE) {
            let compositeFactor = 0;
            if (mouse.current.x !== null && mouse.current.y !== null) {
              const dx1 = mouse.current.x - node.x;
              const dy1 = mouse.current.y - node.y;
              const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
              const factorA = Math.max(0, Math.min(1, (CONNECTION_DISTANCE - d1) / CONNECTION_DISTANCE));
              
              const dx2 = mouse.current.x - otherNode.x;
              const dy2 = mouse.current.y - otherNode.y;
              const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
              const factorB = Math.max(0, Math.min(1, (CONNECTION_DISTANCE - d2) / CONNECTION_DISTANCE));
              
              compositeFactor = (factorA + factorB) / 2;
            }
            const r = Math.round(180 * (1 - compositeFactor) + 0 * compositeFactor);
            const g = Math.round(180 * (1 - compositeFactor) + 122 * compositeFactor);
            const b = Math.round(180 * (1 - compositeFactor) + 255 * compositeFactor);
            const edgeAlpha = 1 - (edgeDist / CONNECTION_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${edgeAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId.current = requestAnimationFrame(updateNodes);
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);
    window.addEventListener("mousemove", trackMouse);
    window.addEventListener("mouseleave", resetMouse);
    updateNodes();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("mousemove", trackMouse);
      window.removeEventListener("mouseleave", resetMouse);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="graph-canvas" />;
};

export default Graph;