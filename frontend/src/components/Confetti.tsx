'use client';
import React, { useEffect, useRef } from 'react';

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    interface ConfettiPiece {
      x: number; y: number; rotation: number;
      color: string; size: number; speed: number; oscillation: number;
    }
    const pieces: ConfettiPiece[] = [];
    const numberOfPieces = 150;
    const colors = ['#4b0082', '#B8860B', '#D4AF37', '#7b41b3', '#ddb7ff'];

    function setupCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createPieces() {
        if (!canvas) return;
        for (let i = 0; i < numberOfPieces; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                speed: Math.random() * 3 + 2,
                oscillation: Math.random() * 2
            });
        }
    }

    function updatePieces() {
        if (!canvas) return;
        for (let i = 0; i < pieces.length; i++) {
            const p = pieces[i];
            p.y += p.speed;
            p.x += Math.sin(p.y / 20) * p.oscillation;
            p.rotation += p.speed;
            if (p.y > canvas.height) {
                pieces.splice(i, 1);
                i--;
            }
        }
    }

    function drawPieces() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });
    }

    function animateConfetti() {
        updatePieces();
        drawPieces();
        if (pieces.length > 0) {
            animationFrameId = requestAnimationFrame(animateConfetti);
        } else {
            if (canvas) {
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    setupCanvas();
    const timeoutId = setTimeout(() => {
        createPieces();
        animateConfetti();
    }, 300);

    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }} />;
}
