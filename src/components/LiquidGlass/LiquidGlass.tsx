// By AkiyaStudio

import React, { useEffect, useRef, useState, useId } from "react";
import "./LiquidGlass.css";

interface LiquidGlassProps {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	/** Refractive index of the glass (1.0 = air, 1.5 = glass, 2.0 = diamond) */
	refractiveIndex?: number;
	/** Width of the bezel (curved edge) relative to the radius, 0-1 */
	bezelWidth?: number;
	/** Maximum thickness of the glass surface (affects refraction strength) */
	thickness?: number;
	/** Optional border radius override, converted from a 1920-wide viewport baseline */
	borderRadius?: number;
	/** Opacity of the specular highlight, 0-1 (default: 1.0) */
	specularOpacity?: number;
	/** Direction of the specular light in degrees (default: 225, from top-left) */
	lightAngle?: number;
	/** Saturation of the refracted content, in percent (100 = normal) */
	specularSaturation?: number;
	/** Refraction level multiplier, 0-1 (default: 0.66) */
	refractionLevel?: number;
	/** Blur level applied on top of refraction (default: 0.0) */
	blurLevel?: number;
	/** Internal displacement-map resolution multiplier (default: 4) */
	filterQuality?: number;
}

type DisplacementMap = {
	dataUrl: string;
	maxDisplacement: number;
};

type FilterData = {
	displacementUrl: string;
	specularUrl: string;
	scale: number;
	width: number;
	height: number;
};

const MAP_CACHE_LIMIT = 40;
const displacementMapCache = new Map<string, DisplacementMap>();
const specularMapCache = new Map<string, string>();
const FILTER_QUALITY = 4;

function setBoundedCacheValue<T>(cache: Map<string, T>, key: string, value: T) {
	if (cache.size >= MAP_CACHE_LIMIT) {
		const oldestKey = cache.keys().next().value;
		if (oldestKey !== undefined) cache.delete(oldestKey);
	}
	cache.set(key, value);
	return value;
}

function roundedNumber(value: number, precision = 3): number {
	const factor = 10 ** precision;
	return Math.round(value * factor) / factor;
}

function getMapKey(values: Array<number | string>): string {
	return values
		.map((value) =>
			typeof value === "number" ? String(roundedNumber(value)) : value,
		)
		.join(":");
}

// ─── Surface Function (Squircle - Apple style) ────────────────────────
// t goes from 0 (outer edge) to 1 (end of bezel / start of flat surface)
function squircleSurface(t: number): number {
	// Attempt to recreate the smoother squircle-like curve Apple uses.
	// The exponent controls how "smoothed" the transition is.
	const n = 4; // squircle exponent
	return Math.pow(1 - Math.pow(1 - t, n), 1 / n);
}

// ─── Derivative (numerical) ────────────────────────────────────────────
function surfaceDerivative(
	f: (t: number) => number,
	t: number,
	delta = 0.001,
): number {
	const y1 = f(Math.max(0, t - delta));
	const y2 = f(Math.min(1, t + delta));
	return (y2 - y1) / (2 * delta);
}

// ─── Snell's Law Refraction ────────────────────────────────────────────
// Returns the displacement in pixels for a ray hitting the surface at position t
// with the given glass thickness and refractive index.
function calculateDisplacement(
	t: number,
	thickness: number,
	n1: number, // air
	n2: number, // glass
	surfaceFn: (t: number) => number,
): number {
	if (t <= 0 || t >= 1) return 0;

	const derivative = surfaceDerivative(surfaceFn, t);

	// Surface normal (perpendicular to the slope)
	// The normal vector is (-derivative, 1), normalized
	const normalLen = Math.sqrt(derivative * derivative + 1);
	const nx = -derivative / normalLen;
	// const ny = 1 / normalLen; // not used directly

	// Incident ray is vertical (0, -1). Angle of incidence = angle between
	// ray and surface normal. Since ray is (0, -1):
	// cos(theta_i) = |dot((0,-1), normal)| = 1/normalLen
	const cosTheta1 = 1 / normalLen;
	const sinTheta1 = Math.sqrt(1 - cosTheta1 * cosTheta1);

	// Snell's law: n1 * sin(theta1) = n2 * sin(theta2)
	const sinTheta2 = (n1 / n2) * sinTheta1;

	// Total internal reflection check
	if (sinTheta2 >= 1) return 0;

	const cosTheta2 = Math.sqrt(1 - sinTheta2 * sinTheta2);

	// The refracted ray direction (in the 2D cross-section)
	// We need to calculate how far the ray is displaced horizontally
	// after traveling through glass of height = surfaceFn(t) * thickness
	const glassHeight = surfaceFn(t) * thickness;

	// Horizontal displacement = glassHeight * tan(theta2) - glassHeight * tan(theta1)
	// But since incident ray is vertical, tan(theta1) contribution is just the slope effect
	const tanTheta2 = sinTheta2 / cosTheta2;
	const displacement = glassHeight * tanTheta2;

	// Direction: displacement points toward the center (inward for convex)
	// The sign of nx tells us which side we're on
	return displacement * Math.sign(nx);
}

// ─── Generate Displacement Map ─────────────────────────────────────────
function getNumericRadius(value: string): number {
	const firstValue = value.split(" ")[0];
	const parsed = Number.parseFloat(firstValue);
	return Number.isFinite(parsed) ? parsed : 0;
}

function getEffectiveRadius(el: HTMLElement): number {
	const style = window.getComputedStyle(el);
	return Math.max(
		getNumericRadius(style.borderTopLeftRadius),
		getNumericRadius(style.borderTopRightRadius),
		getNumericRadius(style.borderBottomRightRadius),
		getNumericRadius(style.borderBottomLeftRadius),
	);
}

function getSquareEdgeVector(
	x: number,
	y: number,
	width: number,
	height: number,
): { distance: number; dirX: number; dirY: number } {
	const distances = [
		{ distance: x, dirX: 1, dirY: 0 },
		{ distance: width - 1 - x, dirX: -1, dirY: 0 },
		{ distance: y, dirX: 0, dirY: 1 },
		{ distance: height - 1 - y, dirX: 0, dirY: -1 },
	];

	return distances.reduce((closest, current) =>
		current.distance < closest.distance ? current : closest,
	);
}

function generateDisplacementMap(
	width: number,
	height: number,
	borderRadius: number,
	refractiveIndex: number,
	bezelWidth: number,
	thickness: number,
): DisplacementMap {
	const cacheKey = getMapKey([
		width,
		height,
		borderRadius,
		refractiveIndex,
		bezelWidth,
		thickness,
	]);
	const cached = displacementMapCache.get(cacheKey);
	if (cached) return cached;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;
	const imageData = ctx.createImageData(width, height);
	const data = imageData.data;

	// Pre-calculate displacement magnitudes along one radius (127 samples as per article)
	const SAMPLES = 1024;
	const displacements: number[] = [];
	let maxDisplacement = 0;

	for (let i = 0; i <= SAMPLES; i++) {
		const t = i / SAMPLES; // 0 = edge, 1 = end of bezel
		const disp = Math.abs(
			calculateDisplacement(
				t,
				thickness,
				1.0,
				refractiveIndex,
				squircleSurface,
			),
		);
		displacements.push(disp);
		if (disp > maxDisplacement) maxDisplacement = disp;
	}

	// Normalize displacements
	const normalizedDisplacements = displacements.map((d) =>
		maxDisplacement > 0 ? d / maxDisplacement : 0,
	);
	const sampleDisplacement = (t: number) => {
		const position = Math.max(0, Math.min(1, t)) * SAMPLES;
		const left = Math.floor(position);
		const right = Math.min(SAMPLES, left + 1);
		const mix = position - left;
		return (
			normalizedDisplacements[left] * (1 - mix) +
			normalizedDisplacements[right] * mix
		);
	};

	// Effective radius (clamped to half the smallest dimension)
	const radius = Math.min(borderRadius, width / 2, height / 2);
	const edgeBezel = Math.max(1, Math.min(width, height) * 0.18 * bezelWidth);
	const bezelPx = radius > 0 ? radius * bezelWidth : edgeBezel;

	// For each pixel, calculate displacement vector
	for (let py = 0; py < height; py++) {
		for (let x = 0; x < width; x++) {
			const idx = (py * width + x) * 4;

			// Calculate distance from the nearest edge of the rounded rectangle
			// This handles the pill/rounded-rect shape
			const cx = width / 2;
			const cy = height / 2;

			if (radius <= 0) {
				const edge = getSquareEdgeVector(x, py, width, height);

				if (edge.distance >= bezelPx) {
					data[idx] = 128;
					data[idx + 1] = 128;
					data[idx + 2] = 128;
					data[idx + 3] = 255;
					continue;
				}

				const t = edge.distance / bezelPx;
				const magnitude = sampleDisplacement(t);
				const dispX = edge.dirX * magnitude;
				const dispY = edge.dirY * magnitude;

				data[idx] = Math.round(128 + dispX * 127);
				data[idx + 1] = Math.round(128 + dispY * 127);
				data[idx + 2] = 128;
				data[idx + 3] = 255;
				continue;
			}

			// Distance to the inner rectangle (before rounding)
			const innerW = width / 2 - radius;
			const innerH = height / 2 - radius;

			// Relative position from center
			const rx = x - cx;
			const ry = py - cy;

			if (Math.abs(rx) <= innerW && Math.abs(ry) <= innerH) {
				// Inside the flat center → no displacement
				data[idx] = 128; // R (neutral)
				data[idx + 1] = 128; // G (neutral)
				data[idx + 2] = 128; // B
				data[idx + 3] = 255; // A
				continue;
			}

			// Find closest point on the inner rectangle
			const clampedX = Math.max(-innerW, Math.min(innerW, rx));
			const clampedY = Math.max(-innerH, Math.min(innerH, ry));

			// Vector from clamped point to current pixel
			const dx = rx - clampedX;
			const dy = ry - clampedY;
			const distFromCorner = Math.sqrt(dx * dx + dy * dy);

			if (distFromCorner > radius) {
				// Outside the shape entirely
				data[idx] = 128;
				data[idx + 1] = 128;
				data[idx + 2] = 128;
				data[idx + 3] = 255;
				continue;
			}

			// Distance from the border (0 = at border, bezelPx = end of bezel)
			const distFromBorder = radius - distFromCorner;
			// Angle pointing inward (toward center from border)
			const angleToCenter = Math.atan2(-dy, -dx);

			// Normalize distance to 0-1 range within the bezel
			let t: number;
			if (distFromBorder >= bezelPx) {
				// Past the bezel → flat surface, no displacement
				data[idx] = 128;
				data[idx + 1] = 128;
				data[idx + 2] = 128;
				data[idx + 3] = 255;
				continue;
			} else {
				t = distFromBorder / bezelPx; // 0 at border → 1 at bezel end
			}

			// Look up normalized displacement magnitude
			const magnitude = sampleDisplacement(t);

			// Convert to cartesian displacement (article: vector to R,G values)
			const dispX = Math.cos(angleToCenter) * magnitude;
			const dispY = Math.sin(angleToCenter) * magnitude;

			// Encode as RGB (128 = neutral, article formula)
			data[idx] = Math.round(128 + dispX * 127); // R = X displacement
			data[idx + 1] = Math.round(128 + dispY * 127); // G = Y displacement
			data[idx + 2] = 128; // B = unused
			data[idx + 3] = 255; // A = opaque
		}
	}

	ctx.putImageData(imageData, 0, 0);
	return setBoundedCacheValue(displacementMapCache, cacheKey, {
		dataUrl: canvas.toDataURL(),
		maxDisplacement,
	});
}

// ─── Generate Specular Highlight ───────────────────────────────────────
function generateSpecularHighlight(
	width: number,
	height: number,
	borderRadius: number,
	bezelWidth: number,
	specularOpacity: number,
	lightAngle: number,
): string {
	const cacheKey = getMapKey([
		width,
		height,
		borderRadius,
		bezelWidth,
		specularOpacity,
		lightAngle,
	]);
	const cached = specularMapCache.get(cacheKey);
	if (cached) return cached;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;
	const imageData = ctx.createImageData(width, height);
	const data = imageData.data;

	const radius = Math.min(borderRadius, width / 2, height / 2);
	const edgeBezel = Math.max(1, Math.min(width, height) * 0.18 * bezelWidth);
	const bezelPx = radius > 0 ? radius * bezelWidth : edgeBezel;

	const angle = (lightAngle * Math.PI) / 180;
	const lx = Math.cos(angle);
	const ly = Math.sin(angle);

	for (let py = 0; py < height; py++) {
		for (let x = 0; x < width; x++) {
			const idx = (py * width + x) * 4;

			if (radius <= 0) {
				const edge = getSquareEdgeVector(x, py, width, height);

				if (edge.distance >= bezelPx) {
					data[idx] = 0;
					data[idx + 1] = 0;
					data[idx + 2] = 0;
					data[idx + 3] = 0;
					continue;
				}

				const t = edge.distance / bezelPx;
				const slopeWeight = 1 - squircleSurface(t);
				const nx = -edge.dirX;
				const ny = -edge.dirY;
				const facing = Math.max(0, nx * lx + ny * ly);
				const edgeRim = Math.pow(1 - t, 1.6);
				const specular =
					(Math.pow(facing, 2.2) * 0.7 + Math.pow(facing, 9) * 0.45) *
					edgeRim *
					slopeWeight;
				const intensity = Math.round(specular * 255 * specularOpacity);

				data[idx] = 255;
				data[idx + 1] = 255;
				data[idx + 2] = 255;
				data[idx + 3] = Math.min(255, intensity);
				continue;
			}

			const cx = width / 2;
			const cy = height / 2;
			const innerW = width / 2 - radius;
			const innerH = height / 2 - radius;
			const rx = x - cx;
			const ry = py - cy;

			const clampedX = Math.max(-innerW, Math.min(innerW, rx));
			const clampedY = Math.max(-innerH, Math.min(innerH, ry));
			const dx = rx - clampedX;
			const dy = ry - clampedY;
			const distFromCorner = Math.sqrt(dx * dx + dy * dy);

			if (distFromCorner > radius || distFromCorner === 0) {
				data[idx] = 0;
				data[idx + 1] = 0;
				data[idx + 2] = 0;
				data[idx + 3] = 0;
				continue;
			}

			const distFromBorder = radius - distFromCorner;

			if (distFromBorder >= bezelPx) {
				data[idx] = 0;
				data[idx + 1] = 0;
				data[idx + 2] = 0;
				data[idx + 3] = 0;
				continue;
			}

			const t = distFromBorder / bezelPx;

			// Surface normal direction (outward from center in the bezel zone)
			const nx = dx / distFromCorner;
			const ny = dy / distFromCorner;

			// Blend between outward normal (at edge) and up (at flat)
			const slopeWeight = 1 - squircleSurface(t);

			const facing = Math.max(0, nx * lx + ny * ly);
			const edgeRim = Math.pow(1 - t, 1.55);
			const diagonalFalloff = Math.max(
				0,
				((rx / width) * lx + (ry / height) * ly + 0.48) * 1.4,
			);
			const specular =
				(Math.pow(facing, 2.15) * 0.72 + Math.pow(facing, 10) * 0.5) *
				edgeRim *
				slopeWeight *
				(0.72 + diagonalFalloff * 0.28);

			// Encode as white with varying alpha, scaled by specularOpacity
			const intensity = Math.round(specular * 255 * specularOpacity);
			data[idx] = 255;
			data[idx + 1] = 255;
			data[idx + 2] = 255;
			data[idx + 3] = Math.min(255, intensity);
		}
	}

	ctx.putImageData(imageData, 0, 0);
	return setBoundedCacheValue(specularMapCache, cacheKey, canvas.toDataURL());
}

// ─── Component ─────────────────────────────────────────────────────────
const LiquidGlass: React.FC<LiquidGlassProps> = ({
	children,
	className = "",
	refractiveIndex = 1.5,
	bezelWidth = 0.8,
	thickness = 8,
	borderRadius,
	specularOpacity = 1.0,
	lightAngle = 225,
	specularSaturation = 41,
	refractionLevel = 0.66,
	blurLevel = 0.0,
	filterQuality = FILTER_QUALITY,
	style,
}) => {
	const filterId = useId().replace(/:/g, "_");
	const containerRef = useRef<HTMLDivElement>(null);
	const [filterData, setFilterData] = useState<FilterData | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		let frameId = 0;

		const updateFilter = () => {
			frameId = 0;
			const rect = el.getBoundingClientRect();
			const w = Math.round(rect.width);
			const h = Math.round(rect.height);

			if (w === 0 || h === 0) return;

			const quality = Math.min(
				Math.max(window.devicePixelRatio || 1, filterQuality),
				10,
			);
			const mapW = Math.max(1, Math.round(w * quality));
			const mapH = Math.max(1, Math.round(h * quality));
			const effectiveRadius =
				borderRadius === undefined
					? getEffectiveRadius(el)
					: (borderRadius / 1920) * window.innerWidth;

			const { dataUrl, maxDisplacement } = generateDisplacementMap(
				mapW,
				mapH,
				effectiveRadius * quality,
				refractiveIndex,
				bezelWidth,
				thickness * quality,
			);

			const specUrl = generateSpecularHighlight(
				mapW,
				mapH,
				effectiveRadius * quality,
				bezelWidth,
				specularOpacity,
				lightAngle,
			);

			setFilterData({
				displacementUrl: dataUrl,
				specularUrl: specUrl,
				scale: maxDisplacement / quality,
				width: w,
				height: h,
			});
		};

		const scheduleFilterUpdate = () => {
			if (frameId) return;
			frameId = window.requestAnimationFrame(updateFilter);
		};

		scheduleFilterUpdate();

		// Use ResizeObserver to regenerate on size change
		const observer = new ResizeObserver(() => {
			scheduleFilterUpdate();
		});
		observer.observe(el);

		return () => {
			observer.disconnect();
			if (frameId) window.cancelAnimationFrame(frameId);
		};
	}, [
		borderRadius,
		refractiveIndex,
		bezelWidth,
		thickness,
		specularOpacity,
		lightAngle,
		filterQuality,
	]);

	// Apply backdrop-filter via JS so it survives the build's CSS pipeline.
	// Turbopack + Tailwind v4 (Lightning CSS) strip `backdrop-filter: url(#svg)`
	// from stylesheets => the glass renders `none`. Inline styles set at runtime
	// are NOT processed by the build, so the SVG displacement survives.
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const value = filterData
			? `url(#${filterId})`
			: "blur(12px) saturate(120%)";
		el.style.backdropFilter = value;
		el.style.setProperty("-webkit-backdrop-filter", value);
	}, [filterData, filterId]);

	const radiusStyle =
		borderRadius === undefined
			? undefined
			: { borderRadius: `${(borderRadius / 1920) * 100}vw` };
	const mergedStyle = { ...style, ...radiusStyle };

	return (
		<div
			className={`liquid-glass ${className}`}
			ref={containerRef}
			style={mergedStyle}
		>
			{/* SVG Filter — following kube.io architecture */}
			{filterData && (
				<svg
					style={{ position: "absolute", width: 0, height: 0 }}
					aria-hidden="true"
					focusable="false"
					xmlns="http://www.w3.org/2000/svg"
				>
					<filter
						id={filterId}
						colorInterpolationFilters="sRGB"
						x="0"
						y="0"
						width={filterData.width}
						height={filterData.height}
						filterUnits="userSpaceOnUse"
					>
						{/* 1. Load the pre-computed displacement map as image */}
						<feImage
							href={filterData.displacementUrl}
							x={0}
							y={0}
							width={filterData.width}
							height={filterData.height}
							result="displacement_map"
						/>

						{/* 2. Apply displacement to the backdrop (SourceGraphic) */}
						{/* refractionLevel scales the displacement effect */}
						<feDisplacementMap
							in="SourceGraphic"
							in2="displacement_map"
							scale={filterData.scale * refractionLevel}
							xChannelSelector="R"
							yChannelSelector="G"
							result="refracted"
						/>

						{/* 3. Optional blur on refracted result */}
						{blurLevel > 0 && (
							<feGaussianBlur
								in="refracted"
								stdDeviation={blurLevel}
								result="refracted"
							/>
						)}

						<feColorMatrix
							in="refracted"
							type="saturate"
							values={String(specularSaturation / 100)}
							result="refracted_saturated"
						/>

						{/* 4. Load the specular highlight image */}
						<feImage
							href={filterData.specularUrl}
							x={0}
							y={0}
							width={filterData.width}
							height={filterData.height}
							result="specular_raw"
						/>

						{/* 5. Apply saturation to specular highlight */}
						<feColorMatrix
							in="specular_raw"
							type="saturate"
							values="0"
							result="specular"
						/>

						{/* 6. Blend specular on top of refracted result */}
						<feBlend
							in="specular"
							in2="refracted_saturated"
							mode="screen"
							result="final"
						/>
					</filter>
				</svg>
			)}

			{children}
		</div>
	);
};

export default LiquidGlass;
