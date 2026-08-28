"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { PCAProjectionPoint, ArchetypeInterpretation } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getClusterColor } from "@/components/segmentation/colors";
import { Info, RotateCcw, Box, Eye } from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";

export interface PCAScatterPlotProps {
  points: PCAProjectionPoint[];
  archetypes: Record<number, ArchetypeInterpretation>;
  explainedVarianceRatio?: number[];
  totalExplainedVariance?: number;
  featureCount?: number;
  selectedClusterId: number | null;
  onSelectCluster: (clusterId: number | null) => void;
  className?: string;
}

export function PCAScatterPlot({
  points,
  archetypes,
  explainedVarianceRatio = [],
  totalExplainedVariance = 0,
  featureCount = 24,
  selectedClusterId,
  onSelectCluster,
  className,
}: PCAScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: PCAProjectionPoint;
    screenX: number;
    screenY: number;
  } | null>(null);

  const pc1Pct = explainedVarianceRatio[0] !== undefined ? (explainedVarianceRatio[0] * 100).toFixed(1) : "0.0";
  const pc2Pct = explainedVarianceRatio[1] !== undefined ? (explainedVarianceRatio[1] * 100).toFixed(1) : "0.0";
  const pc3Pct = explainedVarianceRatio[2] !== undefined ? (explainedVarianceRatio[2] * 100).toFixed(1) : "0.0";
  const totalPct = totalExplainedVariance !== undefined ? (totalExplainedVariance * 100).toFixed(2) : "0.00";

  // 3D Camera Angles & Zoom State
  const [yaw, setYaw] = useState<number>(0.6); // Rotation around Y-axis
  const [pitch, setPitch] = useState<number>(0.35); // Rotation around X-axis
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute bounding box extents
  const bounds = useMemo(() => {
    if (!points || points.length === 0) {
      return { minX: -5, maxX: 5, minY: -5, maxY: 5, minZ: -5, maxZ: 5 };
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }

    // Add 10% padding
    const padX = (maxX - minX) * 0.1 || 1;
    const padY = (maxY - minY) * 0.1 || 1;
    const padZ = (maxZ - minZ) * 0.1 || 1;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
      minZ: minZ - padZ,
      maxZ: maxZ + padZ,
    };
  }, [points]);

  // Handle Mouse / Touch Orbiting for 3D
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode !== "3D") return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && viewMode === "3D") {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setYaw((prev) => prev + deltaX * 0.008);
      setPitch((prev) => Math.max(-1.4, Math.min(1.4, prev + deltaY * 0.008)));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }

    // Find nearest point for hover tooltip
    if (projectedPointsRef.current.length > 0) {
      let nearest: { point: PCAProjectionPoint; dist: number; sx: number; sy: number } | null = null;
      for (const item of projectedPointsRef.current) {
        const dx = item.sx - mouseX;
        const dy = item.sy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 12 && (!nearest || dist < nearest.dist)) {
          nearest = { point: item.point, dist, sx: item.sx, sy: item.sy };
        }
      }

      if (nearest) {
        setHoveredPoint({
          point: nearest.point,
          screenX: nearest.sx,
          screenY: nearest.sy,
        });
      } else if (!isDragging) {
        setHoveredPoint(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = () => {
    if (hoveredPoint && onSelectCluster) {
      const cId = hoveredPoint.point.cluster_id;
      onSelectCluster(selectedClusterId === cId ? null : cId);
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (viewMode !== "3D") return;
    e.preventDefault();
    setZoom((prev) => Math.max(0.4, Math.min(2.5, prev - e.deltaY * 0.001)));
  }, [viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Projected 2D screen coordinates cache for hover hit-testing
  const projectedPointsRef = useRef<Array<{ point: PCAProjectionPoint; sx: number; sy: number }>>([]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High-DPI display
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 700;
    const height = canvas.clientHeight || 450;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const projectedList: Array<{ point: PCAProjectionPoint; sx: number; sy: number }> = [];

    if (viewMode === "2D") {
      // 2D Projection: PC1 (X) vs PC2 (Y)
      const pad = 50;
      const plotW = width - pad * 2;
      const plotH = height - pad * 2;

      // Draw Grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const gx = pad + (plotW / 6) * i;
        const gy = pad + (plotH / 6) * i;
        ctx.moveTo(gx, pad);
        ctx.lineTo(gx, height - pad);
        ctx.moveTo(pad, gy);
        ctx.lineTo(width - pad, gy);
      }
      ctx.stroke();

      // Zero Axes
      const zeroX = pad + ((0 - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
      const zeroY = height - pad - ((0 - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;
      ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      if (zeroX >= pad && zeroX <= width - pad) {
        ctx.moveTo(zeroX, pad);
        ctx.lineTo(zeroX, height - pad);
      }
      if (zeroY >= pad && zeroY <= height - pad) {
        ctx.moveTo(pad, zeroY);
        ctx.lineTo(width - pad, zeroY);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Points
      for (const p of points) {
        const sx = pad + ((p.x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
        const sy = height - pad - ((p.y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;
        projectedList.push({ point: p, sx, sy });

        const isClusterSelected = selectedClusterId === null || selectedClusterId === p.cluster_id;
        const color = getClusterColor(p.cluster_id);

        ctx.fillStyle = color.hex;
        ctx.globalAlpha = isClusterSelected ? 0.85 : 0.12;
        ctx.beginPath();
        ctx.arc(sx, sy, isClusterSelected ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // Axis Labels
      ctx.fillStyle = "#64748b";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `PC1 — First Principal Component (${pc1Pct}% Variance)`,
        width / 2,
        height - 12
      );

      ctx.save();
      ctx.translate(14, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(
        `PC2 — Second Principal Component (${pc2Pct}% Variance)`,
        0,
        0
      );
      ctx.restore();
    } else {
      // 3D Isometric / Orbit Perspective Projection
      const cx = width / 2;
      const cy = height / 2;
      const scale = (Math.min(width, height) / 8.5) * zoom;

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      // Project 3D Point to 2D
      const project3D = (x: number, y: number, z: number) => {
        // Rotate around Y (yaw)
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Rotate around X (pitch)
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;

        // Perspective division
        const fov = 350;
        const depth = fov / (fov + z2 * 8);
        const sx = cx + x1 * scale * depth;
        const sy = cy - y2 * scale * depth;

        return { sx, sy, depth: z2 };
      };

      // Draw 3D Axes Box Wireframe
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      const axisLen = 3.5;
      const origin = project3D(0, 0, 0);
      const axX = project3D(axisLen, 0, 0);
      const axY = project3D(0, axisLen, 0);
      const axZ = project3D(0, 0, axisLen);

      ctx.beginPath();
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo(axX.sx, axX.sy);
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo(axY.sx, axY.sy);
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo(axZ.sx, axZ.sy);
      ctx.stroke();

      // Axis Tags
      ctx.fillStyle = "#64748b";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(`PC1 (${pc1Pct}%)`, axX.sx + 4, axX.sy);
      ctx.fillText(`PC2 (${pc2Pct}%)`, axY.sx, axY.sy - 4);
      ctx.fillText(`PC3 (${pc3Pct}%)`, axZ.sx + 4, axZ.sy);

      // Sort points by depth (farthest first)
      const sortedPoints = points
        .map((p) => {
          const prj = project3D(p.x, p.y, p.z);
          return { point: p, sx: prj.sx, sy: prj.sy, depth: prj.depth };
        })
        .sort((a, b) => a.depth - b.depth);

      // Render 3D points
      for (const item of sortedPoints) {
        projectedList.push({ point: item.point, sx: item.sx, sy: item.sy });

        const isClusterSelected =
          selectedClusterId === null || selectedClusterId === item.point.cluster_id;
        const color = getClusterColor(item.point.cluster_id);

        ctx.fillStyle = color.hex;
        ctx.globalAlpha = isClusterSelected ? 0.85 : 0.1;
        ctx.beginPath();
        const ptRadius = Math.max(1.8, (isClusterSelected ? 4 : 2.2) * (1 - item.depth * 0.05));
        ctx.arc(item.sx, item.sy, ptRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
    }

    projectedPointsRef.current = projectedList;
  }, [points, bounds, viewMode, yaw, pitch, zoom, selectedClusterId, pc1Pct, pc2Pct, pc3Pct]);

  const reset3DView = () => {
    setYaw(0.6);
    setPitch(0.35);
    setZoom(1.0);
  };

  return (
    <Card className={cn("border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm flex items-center gap-2">
            <Box className="h-4 w-4 text-indigo-500" />
            Interactive PCA Latent Space Scatter Projection
          </CardTitle>
          <CardDescription className="text-xs">
            Dimensionality reduction projection capturing {formatNumber(points.length)} analyzed buyers
          </CardDescription>
        </div>

        {/* 2D / 3D Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800" role="group" aria-label="Toggle 2D or 3D view">
            <button
              type="button"
              onClick={() => setViewMode("2D")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                viewMode === "2D"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              2D View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("3D")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                viewMode === "3D"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              3D View
            </button>
          </div>

          {viewMode === "3D" && (
            <button
              type="button"
              onClick={reset3DView}
              className="flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Reset 3D Camera Angles"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Statistical Variance Disclaimer Banner */}
        <div className="flex items-start gap-2.5 rounded-lg bg-indigo-50/60 p-3 text-xs text-indigo-950 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-200 dark:border-indigo-900/40">
          <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Statistical Projection Notice:</strong> This visualization represents{" "}
            <strong>{totalPct}% of cumulative variance</strong> captured by the first three principal components
            (PC1: {pc1Pct}%, PC2: {pc2Pct}%, PC3: {pc3Pct}%). It is an exploratory 2D/3D projection of the{" "}
            {featureCount}-dimensional standardized feature matrix (StandardScaler, gender excluded), not the complete feature space.
            Authoritative cluster differentiation is governed by the empirical statistical profiles and silhouette diagnostics (~0.125).
          </p>
        </div>

        {/* Interactive Canvas Viewport */}
        <div
          ref={containerRef}
          className="relative h-[440px] w-full rounded-xl border border-slate-200 bg-slate-950 overflow-hidden cursor-crosshair dark:border-slate-800"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            onMouseLeave={handleMouseUp}
            className="h-full w-full block"
          />

          {/* Floating Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full mb-3 rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 text-xs text-white shadow-xl backdrop-blur-md"
              style={{
                left: `${hoveredPoint.screenX}px`,
                top: `${hoveredPoint.screenY}px`,
              }}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getClusterColor(hoveredPoint.point.cluster_id).hex }}
                />
                <span>Client {hoveredPoint.point.client_id}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  [Cluster {hoveredPoint.point.cluster_id}]
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                {archetypes[hoveredPoint.point.cluster_id]?.display_name ||
                  archetypes[hoveredPoint.point.cluster_id]?.generated_name ||
                  `Cluster ${hoveredPoint.point.cluster_id}`}
              </p>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                <span>PC1: {hoveredPoint.point.x.toFixed(2)}</span>
                <span>PC2: {hoveredPoint.point.y.toFixed(2)}</span>
                {viewMode === "3D" && <span>PC3: {hoveredPoint.point.z.toFixed(2)}</span>}
              </div>
            </div>
          )}

          {/* Controls Overlay Legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-xs border border-slate-800">
            <Eye className="h-3 w-3 text-slate-400" />
            <span>
              {viewMode === "2D" ? "2D Projection: PC1 vs PC2" : "3D Orbit: Drag to Rotate • Scroll to Zoom"}
            </span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[10px] font-mono text-slate-300 backdrop-blur-xs border border-slate-800">
            <span>{formatNumber(points.length)} Projected Buyers</span>
          </div>
        </div>

        {/* Accessible Textual Summary */}
        <div className="sr-only" aria-live="polite">
          {archetypes &&
            Object.entries(archetypes).map(([cid, arch]) => (
              <p key={cid}>
                Cluster {cid} ({arch?.display_name || arch?.generated_name || `Cluster ${cid}`}):{" "}
                {arch?.count ?? 0} buyers, {(arch?.percentage ?? 0).toFixed(1)} percent of total
                population.
              </p>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
