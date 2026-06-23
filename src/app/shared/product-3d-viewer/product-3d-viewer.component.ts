import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';

/**
 * Pseudo-3D product viewer built from a single flat photo.
 *
 * - Cursor-following perspective tilt (parallax) for a "3D inspect" feel.
 * - Wheel / buttons to zoom; drag to pan when zoomed in.
 * - Fullscreen lightbox for a closer look.
 *
 * No 3D model files needed — works with the product images you already have.
 * Respects prefers-reduced-motion (no tilt when the user opts out).
 */
@Component({
  selector: 'app-product-3d-viewer',
  templateUrl: './product-3d-viewer.component.html',
  styleUrls: ['./product-3d-viewer.component.css']
})
export class Product3dViewerComponent {
  @Input() src = '';
  @Input() alt = 'Product';

  @ViewChild('stage') stage!: ElementRef<HTMLDivElement>;

  // Tilt (degrees) following the cursor.
  rotX = 0;
  rotY = 0;
  glareX = 50;
  glareY = 50;
  hovering = false;

  // Zoom + pan.
  zoom = 1;
  panX = 0;
  panY = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  fullscreen = false;

  private get reducedMotion(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  onPointerMove(event: PointerEvent): void {
    if (this.dragging) {
      this.pan(event);
      return;
    }
    // No tilt while zoomed in (zoom = inspect detail, not rotate) or if the
    // user prefers reduced motion. This prevents the jittery "fast spinning".
    if (this.reducedMotion || this.zoom > 1) {
      return;
    }
    const el = this.stage?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    const max = 10; // max tilt degrees
    this.rotY = (px - 0.5) * 2 * max;
    this.rotX = -(py - 0.5) * 2 * max;
    this.glareX = px * 100;
    this.glareY = py * 100;
  }

  onEnter(): void {
    this.hovering = true;
  }

  onLeave(): void {
    this.hovering = false;
    this.dragging = false;
    this.rotX = 0;
    this.rotY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.2 : -0.2;
    this.setZoom(this.zoom + delta);
  }

  zoomIn(): void { this.setZoom(this.zoom + 0.3); }
  zoomOut(): void { this.setZoom(this.zoom - 0.3); }

  reset(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.rotX = 0;
    this.rotY = 0;
  }

  startDrag(event: PointerEvent): void {
    if (this.zoom <= 1) return; // only pan when zoomed in
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  endDrag(event: PointerEvent): void {
    this.dragging = false;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen;
    this.reset();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.fullscreen) {
      this.fullscreen = false;
      this.reset();
    }
  }

  get imageTransform(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  get stageTransform(): string {
    // Flat (no tilt) when not hovering, when zoomed in, or reduced-motion.
    if (this.reducedMotion || !this.hovering || this.zoom > 1) {
      return 'rotateX(0deg) rotateY(0deg)';
    }
    return `rotateX(${this.rotX}deg) rotateY(${this.rotY}deg)`;
  }

  private pan(event: PointerEvent): void {
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.panX += dx;
    this.panY += dy;
  }

  private setZoom(z: number): void {
    this.zoom = Math.min(3, Math.max(1, Math.round(z * 100) / 100));
    if (this.zoom > 1) {
      // Stop any tilt while zoomed so the image holds still.
      this.rotX = 0;
      this.rotY = 0;
    } else {
      this.panX = 0;
      this.panY = 0;
    }
  }
}
