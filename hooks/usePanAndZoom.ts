import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import { Viewport } from '../types/index';

const usePanAndZoom = (canvasRef: RefObject<HTMLElement>) => {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const pan = useCallback((dx: number, dy: number) => {
    setViewport(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }, []);

  const zoom = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX ?? rect.left + rect.width / 2;
    const mouseY = clientY ?? rect.top + rect.height / 2;

    const mousePoint = { x: mouseX - rect.left, y: mouseY - rect.top };

    setViewport(v => {
      const newZoom = Math.max(0.2, Math.min(3, v.zoom * factor));
      const zoomFactor = newZoom / v.zoom;

      const newX = mousePoint.x - (mousePoint.x - v.x) * zoomFactor;
      const newY = mousePoint.y - (mousePoint.y - v.y) * zoomFactor;

      return { x: newX, y: newY, zoom: newZoom };
    });
  }, [canvasRef]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Only pan with middle mouse button or main button + space
    if (e.button !== 1 && !(e.button === 0 && e.altKey)) return;
    e.preventDefault();
    isPanning.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;
    pan(dx, dy);
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  }, [pan]);
  
  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(factor, e.clientX, e.clientY);
  }, [zoom]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  const canvasStyle = {
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    transformOrigin: '0 0',
  };

  const screenToCanvasCoords = useCallback(({ x, y }: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const canvasX = (x - rect.left - viewport.x) / viewport.zoom;
    const canvasY = (y - rect.top - viewport.y) / viewport.zoom;
    return { x: canvasX, y: canvasY };
  }, [canvasRef, viewport]);

  const resetViewport = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  return { viewport, pan, zoom, canvasStyle, screenToCanvasCoords, resetViewport };
};

export default usePanAndZoom;