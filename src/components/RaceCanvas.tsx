import React, { useEffect, useRef } from 'react';
import { CarConfig, FloatingBonus, Particle, PlayerCar, RoadItem, TrafficCar } from '../types';

interface RaceCanvasProps {
  playerCar: PlayerCar;
  carConfig: CarConfig;
  traffic: TrafficCar[];
  roadItems: RoadItem[];
  particles: Particle[];
  floatingBonuses: FloatingBonus[];
  roadOffset: number;
  roadWidth: number;
}

export const RaceCanvas: React.FC<RaceCanvasProps> = ({
  playerCar,
  carConfig,
  traffic,
  roadItems,
  particles,
  floatingBonuses,
  roadOffset,
  roadWidth,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 600;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const actualRoadW = Math.min(roadWidth, width - 40);
    const roadLeft = centerX - actualRoadW / 2;
    const roadRight = centerX + actualRoadW / 2;
    const laneWidth = actualRoadW / 4;

    // --- 1. ROADSIDE TERRAIN (Night Grass & Cyber City Horizon) ---
    // Background terrain
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Side grass / gravel texture
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, roadLeft, height);
    ctx.fillRect(roadRight, 0, width - roadRight, height);

    // City lights on borders
    const buildingOffset = (roadOffset * 0.15) % 120;
    ctx.fillStyle = '#1e293b';
    for (let by = -120; by < height + 120; by += 80) {
      const y = by + buildingOffset;
      // Left side silhouettes
      if (roadLeft > 40) {
        ctx.fillRect(4, y, roadLeft - 24, 60);
      }
      // Right side silhouettes
      if (width - roadRight > 40) {
        ctx.fillRect(roadRight + 20, y, width - roadRight - 24, 60);
      }
    }

    // --- 2. HIGHWAY SHOULDERS & RED/WHITE CURBS ---
    const curbSegmentH = 30;
    const curbOffset = roadOffset % (curbSegmentH * 2);

    for (let cy = -curbSegmentH * 2; cy < height + curbSegmentH * 2; cy += curbSegmentH) {
      const y = cy + curbOffset;
      const isRed = Math.floor((cy + curbOffset) / curbSegmentH) % 2 === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#f8fafc';

      // Left curb
      ctx.fillRect(roadLeft - 8, y, 8, curbSegmentH);
      // Right curb
      ctx.fillRect(roadRight, y, 8, curbSegmentH);
    }

    // Guardrails
    ctx.fillStyle = '#64748b';
    ctx.fillRect(roadLeft - 12, 0, 4, height);
    ctx.fillRect(roadRight + 8, 0, 4, height);

    // --- 3. ASPHALT ROAD SURFACE ---
    const roadGrad = ctx.createLinearGradient(roadLeft, 0, roadRight, 0);
    roadGrad.addColorStop(0, '#131924');
    roadGrad.addColorStop(0.5, '#1e2532');
    roadGrad.addColorStop(1, '#131924');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(roadLeft, 0, actualRoadW, height);

    // Asphalt tire tracks / lane shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let l = 0; l < 4; l++) {
      const lx = roadLeft + l * laneWidth + laneWidth / 2;
      ctx.fillRect(lx - 16, 0, 8, height);
      ctx.fillRect(lx + 8, 0, 8, height);
    }

    // --- 4. ROAD LANE MARKINGS ---
    const dashLength = 36;
    const dashGap = 32;
    const totalDashH = dashLength + dashGap;
    const dashOffset = roadOffset % totalDashH;

    // 3 lane dividing lines
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;

    for (let l = 1; l < 4; l++) {
      const lineX = roadLeft + l * laneWidth;
      const isCenterLine = l === 2;

      // Center divider is bright amber/yellow dual line
      if (isCenterLine) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        for (let dy = -totalDashH; dy < height + totalDashH; dy += totalDashH) {
          const y = dy + dashOffset;
          ctx.fillRect(lineX - 4, y, 2.5, dashLength);
          ctx.fillRect(lineX + 1.5, y, 2.5, dashLength);
        }
      } else {
        // Standard white dash line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        for (let dy = -totalDashH; dy < height + totalDashH; dy += totalDashH) {
          const y = dy + dashOffset;
          ctx.fillRect(lineX - 1.5, y, 3, dashLength);
        }
      }
    }
    ctx.shadowBlur = 0;

    // --- 5. ROAD ITEMS (COINS, NITRO, REPAIR) ---
    roadItems.forEach((item) => {
      if (item.collected) return;
      if (item.y < -50 || item.y > height + 50) return;

      const itemX = roadLeft + item.lane * laneWidth + laneWidth / 2;
      const itemY = item.y;

      if (item.type === 'coin') {
        // Gold Coin
        const bob = Math.sin(Date.now() * 0.008 + item.id) * 3;
        const cy = itemY + bob;

        // Glow halo
        const halo = ctx.createRadialGradient(itemX, cy, 2, itemX, cy, 16);
        halo.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
        halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(itemX, cy, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(itemX, cy, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(itemX, cy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', itemX, cy);
      } else if (item.type === 'nitro') {
        // N2O Canister
        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
        const cy = itemY;

        // Cyan glow
        ctx.fillStyle = `rgba(6, 182, 212, ${pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(itemX, cy, 18, 0, Math.PI * 2);
        ctx.fill();

        // Cylinder body
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(itemX - 8, cy - 14, 16, 26);
        // Valve
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(itemX - 4, cy - 19, 8, 5);

        // Highlight stripe
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(itemX - 5, cy - 12, 3, 22);

        // N2O label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('N2O', itemX, cy + 2);
      } else if (item.type === 'repair') {
        // Wrench / Repair Kit
        const cy = itemY;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.beginPath();
        ctx.arc(itemX, cy, 18, 0, Math.PI * 2);
        ctx.fill();

        // Toolbox body
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(itemX - 11, cy - 9, 22, 18, 4);
        ctx.fill();

        // White Cross
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(itemX - 2, cy - 6, 4, 12);
        ctx.fillRect(itemX - 6, cy - 2, 12, 4);
      }
    });

    // --- 6. TRAFFIC VEHICLES ---
    traffic.forEach((tv) => {
      if (tv.y < -120 || tv.y > height + 120) return;
      drawTrafficVehicle(ctx, tv, roadLeft, laneWidth);
    });

    // --- 7. PLAYER CAR ---
    drawPlayerCar(ctx, playerCar, carConfig, roadLeft, laneWidth, height);

    // --- 8. PARTICLES ---
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // --- 9. SPEED LINES (On high speed > 180 km/h or Nitro) ---
    if (playerCar.speed > 170 || playerCar.isNitroActive) {
      const intensity = Math.min(1, (playerCar.speed - 160) / 100);
      const lineCount = playerCar.isNitroActive ? 18 : 10;
      ctx.strokeStyle = playerCar.isNitroActive ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;

      for (let i = 0; i < lineCount; i++) {
        const lx = roadLeft + Math.random() * actualRoadW;
        const ly = Math.random() * height;
        const len = 35 + Math.random() * 50 * intensity;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + len);
        ctx.stroke();
      }
    }

    // --- 10. FLOATING BONUS TEXTS ---
    floatingBonuses.forEach((fb) => {
      const alpha = fb.life / 60;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = fb.color;
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = fb.color;
      ctx.shadowBlur = 8;
      ctx.fillText(`${fb.text} +${fb.points}`, fb.x, fb.y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }, [playerCar, carConfig, traffic, roadItems, particles, floatingBonuses, roadOffset, roadWidth]);

  return (
    <div id="race-canvas-container" className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full block cursor-default" />
    </div>
  );
};

// Helper: Draw Traffic Vehicles
function drawTrafficVehicle(
  ctx: CanvasRenderingContext2D,
  tv: TrafficCar,
  roadLeft: number,
  laneWidth: number
) {
  const cx = roadLeft + tv.lane * laneWidth + laneWidth / 2;
  const cy = tv.y;

  ctx.save();
  ctx.translate(cx, cy);

  const w = tv.width;
  const h = tv.height;

  // Car Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 3, -h / 2 + 5, w, h, 6);
  ctx.fill();

  // Headlights or Taillights depending on oncoming
  if (tv.oncoming) {
    // Rotating 180 deg
    ctx.rotate(Math.PI);
  }

  // Wheels
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-w / 2 - 2, -h / 2 + 8, 4, 12);
  ctx.fillRect(w / 2 - 2, -h / 2 + 8, 4, 12);
  ctx.fillRect(-w / 2 - 2, h / 2 - 20, 4, 12);
  ctx.fillRect(w / 2 - 2, h / 2 - 20, 4, 12);

  // Body Chassis
  ctx.fillStyle = tv.color;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, tv.type === 'truck' ? 4 : 8);
  ctx.fill();

  if (tv.type === 'truck') {
    // Semi-truck cab & container
    ctx.fillStyle = '#334155';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 22); // Cab
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 26, w - 4, h - 30); // Cargo container
    // Windshield
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 6, w - 8, 8);
  } else if (tv.type === 'taxi') {
    // Taxi checkers & roof sign
    ctx.fillStyle = '#1e293b';
    // Windshield
    ctx.fillRect(-w / 2 + 4, -h / 2 + 10, w - 8, 9);
    ctx.fillRect(-w / 2 + 5, h / 2 - 16, w - 10, 6);
    // Roof sign
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -4, 16, 7);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, 1.5);
  } else if (tv.type === 'sport') {
    // Sportscar with racing stripe & spoiler
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -h / 2 + 4, 6, h - 8);
    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 4, -h / 2 + 12, w - 8, 11, 2);
    ctx.fill();
    // Rear spoiler
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2 + 2, h / 2 - 4, w - 4, 4);
  } else {
    // Sedan
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 11, w - 8, 9); // front windshield
    ctx.fillRect(-w / 2 + 5, h / 2 - 15, w - 10, 6); // rear windshield
    // Roof
    ctx.fillStyle = tv.color;
    ctx.fillRect(-w / 2 + 4, -h / 2 + 21, w - 8, 14);
  }

  // Front Headlights
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-w / 2 + 3, -h / 2, 5, 2);
  ctx.fillRect(w / 2 - 8, -h / 2, 5, 2);

  // Rear Taillights
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-w / 2 + 3, h / 2 - 2, 5, 2);
  ctx.fillRect(w / 2 - 8, h / 2 - 2, 5, 2);

  ctx.restore();
}

// Helper: Draw Player's Car
function drawPlayerCar(
  ctx: CanvasRenderingContext2D,
  player: PlayerCar,
  config: CarConfig,
  roadLeft: number,
  laneWidth: number,
  canvasHeight: number
) {
  const cx = player.x;
  const cy = player.y;

  ctx.save();
  ctx.translate(cx, cy);

  // Steer Angle (chassis tilt on turn)
  ctx.rotate(player.steerAngle);

  // Flashing transparency on invincibility after collision
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const w = 36;
  const h = 68;

  // --- 1. HEADLIGHT BEAMS (Illuminating the road ahead) ---
  const beamLength = 160 + (player.speed / 280) * 80;
  const lightGrad = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 - beamLength);
  lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
  lightGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.25)');
  lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

  // Left headlight beam cone
  ctx.fillStyle = lightGrad;
  ctx.beginPath();
  ctx.moveTo(-12, -h / 2);
  ctx.lineTo(-40, -h / 2 - beamLength);
  ctx.lineTo(8, -h / 2 - beamLength);
  ctx.closePath();
  ctx.fill();

  // Right headlight beam cone
  ctx.beginPath();
  ctx.moveTo(12, -h / 2);
  ctx.lineTo(-8, -h / 2 - beamLength);
  ctx.lineTo(40, -h / 2 - beamLength);
  ctx.closePath();
  ctx.fill();

  // --- 2. NITRO BOOST EXHAUST FLAMES ---
  if (player.isNitroActive) {
    const flameH = 22 + Math.random() * 16;
    const flameW = 6 + Math.random() * 3;

    // Dual exhaust flames
    [-11, 11].forEach((ex) => {
      const flameGrad = ctx.createLinearGradient(ex, h / 2, ex, h / 2 + flameH);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#38bdf8'); // Neon blue core
      flameGrad.addColorStop(0.7, '#f59e0b'); // Amber tip
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(ex - flameW / 2, h / 2);
      ctx.lineTo(ex + flameW / 2, h / 2);
      ctx.lineTo(ex, h / 2 + flameH);
      ctx.closePath();
      ctx.fill();
    });
  }

  // --- 3. CAR SHADOW ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 4, -h / 2 + 6, w, h, 8);
  ctx.fill();

  // --- 4. WHEELS ---
  ctx.fillStyle = '#090d16';
  // Front left & right wheels (steer slightly with car)
  ctx.save();
  ctx.translate(-w / 2 - 2, -h / 2 + 12);
  ctx.rotate(player.steerAngle * 1.5);
  ctx.fillRect(-2, -6, 5, 14);
  ctx.restore();

  ctx.save();
  ctx.translate(w / 2 + 2, -h / 2 + 12);
  ctx.rotate(player.steerAngle * 1.5);
  ctx.fillRect(-3, -6, 5, 14);
  ctx.restore();

  // Rear wheels
  ctx.fillRect(-w / 2 - 4, h / 2 - 20, 5, 14);
  ctx.fillRect(w / 2 - 1, h / 2 - 20, 5, 14);

  // --- 5. CAR CHASSIS (AERODYNAMIC CURVES) ---
  const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  bodyGrad.addColorStop(0, config.color);
  bodyGrad.addColorStop(0.5, config.accentColor);
  bodyGrad.addColorStop(1, config.color);

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 9);
  ctx.fill();

  // Hood Aerodynamic Inlets / Racing Stripes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-3, -h / 2 + 6, 6, 22);

  // Front Windshield
  const glassGrad = ctx.createLinearGradient(0, -h / 2 + 18, 0, -h / 2 + 32);
  glassGrad.addColorStop(0, '#0f172a');
  glassGrad.addColorStop(1, '#334155');
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 4, -h / 2 + 18, w - 8, 14, 3);
  ctx.fill();

  // Windshield highlight reflection
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 7, -h / 2 + 20);
  ctx.lineTo(-w / 2 + 16, -h / 2 + 30);
  ctx.stroke();

  // Roof
  ctx.fillStyle = config.color;
  ctx.fillRect(-w / 2 + 5, -h / 2 + 33, w - 10, 16);

  // Rear Windshield
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-w / 2 + 5, -h / 2 + 50, w - 10, 8);

  // Rear Racing Spoiler
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-w / 2 + 1, h / 2 - 5, w - 2, 5);
  ctx.fillStyle = config.accentColor;
  ctx.fillRect(-w / 2 + 3, h / 2 - 4, w - 6, 2);

  // --- 6. FRONT HEADLIGHT BULBS ---
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-w / 2 + 3, -h / 2, 6, 3);
  ctx.fillRect(w / 2 - 9, -h / 2, 6, 3);

  // --- 7. REAR BRAKE LIGHTS ---
  const isBraking = player.isBraking;
  ctx.fillStyle = isBraking ? '#ff0000' : '#b91c1c';
  if (isBraking) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
  }
  ctx.fillRect(-w / 2 + 3, h / 2 - 3, 7, 3);
  ctx.fillRect(w / 2 - 10, h / 2 - 3, 7, 3);
  ctx.shadowBlur = 0;

  // --- 8. SMOKE IF CRITICAL HEALTH (1 HP) ---
  if (player.health === 1 && Math.random() < 0.3) {
    ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.beginPath();
    ctx.arc(0, -h / 2 + 4, 8 + Math.random() * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
