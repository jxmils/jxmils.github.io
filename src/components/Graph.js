import React, { useEffect, useRef } from "react";

const NODE_COUNT = 120;
const CONNECTION_DISTANCE = 130;
const SPRING_STRENGTH = 1.0; // Base attraction strength
const FORCE_MULTIPLIER = 0.08; // Extra multiplier for strong attraction
const DAMPING = 0.85; // Lower damping so nodes keep moving
const RANDOM_MOVEMENT = 0.05; // Minimal randomness
const RESTORE_STRENGTH = 0.05; // Restoring force when pointer leaves

const Graph = () => {
  const canvasRef = useRef(null);
  const nodes = useRef([]);
  const mouse = useRef({ x: null, y: null });
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpi = window.devicePixelRatio || 1;

    // Set high-definition canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth * dpi;
      canvas.height = 400 * dpi;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = "400px";
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transforms
      ctx.scale(dpi, dpi); // Scale drawing for high-DPI
      initializeNodes();
    };

    // Initialize nodes with their original positions stored
    const initializeNodes = () => {
      nodes.current = Array.from({ length: NODE_COUNT }, () => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * 400;
        return { x, y, originalX: x, originalY: y, vx: 0, vy: 0 };
      });
    };

    // Track mouse position using window event so we always capture it
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
      ctx.clearRect(0, 0, window.innerWidth, 400);

      nodes.current.forEach((node) => {
        // When mouse is present, pull nodes toward it
        if (mouse.current.x !== null && mouse.current.y !== null) {
          const dx = mouse.current.x - node.x;
          const dy = mouse.current.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < CONNECTION_DISTANCE) {
            const force = (SPRING_STRENGTH / (distance + 1)) * FORCE_MULTIPLIER;
            node.vx += dx * force;
            node.vy += dy * force;
          } else {
            // Apply restoring force when pointer is far
            const restoreDx = node.originalX - node.x;
            const restoreDy = node.originalY - node.y;
            node.vx += restoreDx * RESTORE_STRENGTH;
            node.vy += restoreDy * RESTORE_STRENGTH;
          }
        } else {
          // No mouse: always restore to original position
          const restoreDx = node.originalX - node.x;
          const restoreDy = node.originalY - node.y;
          node.vx += restoreDx * RESTORE_STRENGTH;
          node.vy += restoreDy * RESTORE_STRENGTH;
        }

        // Apply damping and slight random movement
        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.vx += (Math.random() - 0.5) * RANDOM_MOVEMENT;
        node.vy += (Math.random() - 0.5) * RANDOM_MOVEMENT;

        node.x += node.vx;
        node.y += node.vy;

        // Constrain nodes within canvas bounds (bounce if needed)
        if (node.x < 0) { node.x = 0; node.vx *= -1; }
        if (node.x > window.innerWidth) { node.x = window.innerWidth; node.vx *= -1; }
        if (node.y < 0) { node.y = 0; node.vy *= -1; }
        if (node.y > 400) { node.y = 400; node.vy *= -1; }

        // Draw high-definition, glowing node
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.shadowColor = "rgba(255,255,255,0.8)";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      // Draw connections between nodes
      nodes.current.forEach((node) => {
        nodes.current.forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - dist / CONNECTION_DISTANCE})`;
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
