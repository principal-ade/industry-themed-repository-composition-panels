/**
 * Test setup for DOM environment
 * This file is preloaded before running tests to provide browser APIs like Canvas
 */

import { Window } from 'happy-dom';

// Create a window instance and set up global DOM APIs
const window = new Window();
const document = window.document;

// Set globals
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window = window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).document = document;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).HTMLCanvasElement = window.HTMLCanvasElement;

// Mock canvas 2d context since happy-dom doesn't fully support it
// We only need basic structure for testing, not actual rendering
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',

  fillRect: () => {},
  strokeRect: () => {},
  clearRect: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  ellipse: () => {},
  fill: () => {},
  stroke: () => {},
  fillText: () => {},
  strokeText: () => {},
  measureText: () => ({ width: 0 }),
  getImageData: (x: number, y: number, w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  }),
  putImageData: () => {},
  createImageData: (w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  }),
  save: () => {},
  restore: () => {},
  scale: () => {},
  rotate: () => {},
  translate: () => {},
  transform: () => {},
  setTransform: () => {},
  resetTransform: () => {},
  drawImage: () => {},
  createLinearGradient: () => ({}),
  createRadialGradient: () => ({}),
  createPattern: () => null,
};

// Override getContext to return our mock
const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
window.HTMLCanvasElement.prototype.getContext = function (
  contextType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) {
  if (contextType === '2d') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mockContext as any;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return originalGetContext.call(this, contextType as any, ...args);
};
