import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  Trophy,
  Sparkles,
  Gauge,
  Zap,
  Shield,
  Heart,
  Flame,
  Coins,
} from 'lucide-react';
import { RaceCanvas } from './components/RaceCanvas';
import { RaceControls } from './components/RaceControls';
import { GarageModal } from './components/GarageModal';
import { racingAudio } from './utils/racingAudio';
import { CARS } from './utils/cars';
import {
  CarConfig,
  CarId,
  FloatingBonus,
  GameState,
  Particle,
  PlayerCar,
  RoadItem,
  TrafficCar,
  TrafficType,
} from './types';

const ROAD_WIDTH = 380;
const LANE_COUNT = 4;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

export default function App() {
  // Persistence & State
  const [gameState, setGameState] = useState<GameState>('menu');

  const [selectedCarId, setSelectedCarId] = useState<CarId>(() => {
    const saved = localStorage.getItem('racing_car_id') as CarId;
    if (saved && CARS.some((c) => c.id === saved)) return saved;
    return 'lightning_gt';
  });

  const [unlockedCarIds, setUnlockedCarIds] = useState<CarId[]>(() => {
    try {
      const saved = localStorage.getItem('racing_unlocked_cars');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return ['lightning_gt'];
  });

  const [totalCoins, setTotalCoins] = useState<number>(() => {
    return Number(localStorage.getItem('racing_total_coins') || 0);
  });

  const [bestDistance, setBestDistance] = useState<number>(() => {
    return Number(localStorage.getItem('racing_best_distance') || 0);
  });

  const [bestScore, setBestScore] = useState<number>(() => {
    return Number(localStorage.getItem('racing_best_score') || 0);
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => racingAudio.getIsMuted());
  const [isGarageOpen, setIsGarageOpen] = useState(false);

  // In-run variables
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coinsRun, setCoinsRun] = useState(0);
  const [combo, setCombo] = useState(1);
  const [screenShake, setScreenShake] = useState(0);

  const activeCarConfig = CARS.find((c) => c.id === selectedCarId) || CARS[0];

  // Player Car Physics Ref
  const playerRef = useRef<PlayerCar>({
    x: 0, // centered on lane 1 or 2
    y: 440,
    speed: 0,
    steerAngle: 0,
    health: activeCarConfig.maxHealth,
    maxHealth: activeCarConfig.maxHealth,
    nitro: 80,
    maxNitro: 100,
    isNitroActive: false,
    isBraking: false,
    invincibleTimer: 0,
  });
  const [renderPlayer, setRenderPlayer] = useState<PlayerCar>(playerRef.current);

  // Traffic and Items
  const trafficRef = useRef<TrafficCar[]>([]);
  const roadItemsRef = useRef<RoadItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingBonusesRef = useRef<FloatingBonus[]>([]);
  const roadOffsetRef = useRef(0);

  const [renderTraffic, setRenderTraffic] = useState<TrafficCar[]>([]);
  const [renderItems, setRenderItems] = useState<RoadItem[]>([]);
  const [renderParticles, setRenderParticles] = useState<Particle[]>([]);
  const [renderBonuses, setRenderBonuses] = useState<FloatingBonus[]>([]);
  const [renderOffset, setRenderOffset] = useState(0);

  // Input states
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchSteer = useRef<'left' | 'right' | null>(null);
  const touchAccelerate = useRef<boolean>(false);
  const touchBrake = useRef<boolean>(false);
  const touchNitro = useRef<boolean>(false);

  const animationFrameId = useRef<number | null>(null);
  const idCounter = useRef(1);

  // Audio mute toggle
  const toggleMute = () => {
    const next = racingAudio.toggleMute();
    setIsMuted(next);
  };

  // Helper: Trigger floating bonus text
  const triggerBonus = useCallback((text: string, points: number, x: number, y: number, color: string = '#fef08a') => {
    setCombo((c) => {
      const nextCombo = Math.min(5, c + 1);
      const totalPts = points * nextCombo;
      setScore((s) => s + totalPts);

      floatingBonusesRef.current.push({
        id: idCounter.current++,
        text: nextCombo > 1 ? `${text} x${nextCombo}` : text,
        points: totalPts,
        x,
        y,
        life: 55,
        color,
      });

      return nextCombo;
    });
  }, []);

  // Helper: Spawn particles
  const spawnParticles = (
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number = 3
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.random() * 3.5 + 2,
        life: 25,
        maxLife: 25,
      });
    }
  };

  // Reset & Start Game
  const startNewGame = useCallback(() => {
    const car = CARS.find((c) => c.id === selectedCarId) || CARS[0];

    trafficRef.current = [];
    roadItemsRef.current = [];
    particlesRef.current = [];
    floatingBonusesRef.current = [];
    roadOffsetRef.current = 0;

    playerRef.current = {
      x: window.innerWidth ? window.innerWidth / 2 : 400,
      y: 440,
      speed: 70, // start rolling at 70 km/h
      steerAngle: 0,
      health: car.maxHealth,
      maxHealth: car.maxHealth,
      nitro: 80,
      maxNitro: 100,
      isNitroActive: false,
      isBraking: false,
      invincibleTimer: 0,
    };

    setScore(0);
    setDistance(0);
    setCoinsRun(0);
    setCombo(1);
    setScreenShake(0);

    // Initial pre-spawned traffic
    for (let i = 1; i <= 3; i++) {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const types: TrafficType[] = ['sedan', 'sport', 'truck', 'taxi'];
      const type = types[Math.floor(Math.random() * types.length)];
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#64748b', '#e11d48'];

      trafficRef.current.push({
        id: idCounter.current++,
        lane,
        x: 0,
        y: 100 - i * 180,
        speed: 85 + Math.random() * 30,
        type,
        color: type === 'taxi' ? '#eab308' : colors[Math.floor(Math.random() * colors.length)],
        width: type === 'truck' ? 38 : 34,
        height: type === 'truck' ? 95 : 64,
        isOvertaken: false,
        oncoming: false,
      });
    }

    setGameState('playing');
  }, [selectedCarId]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      } else if (e.key === 'r' || e.key === 'R') {
        startNewGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNewGame]);

  // Main 60FPS Game Loop
  useEffect(() => {
    if (gameState !== 'playing') {
      racingAudio.stopEngine();
      return;
    }

    const gameLoop = () => {
      const p = playerRef.current;
      const car = activeCarConfig;

      const keys = keysPressed.current;
      const isLeft = keys['ArrowLeft'] || keys['a'] || keys['A'] || touchSteer.current === 'left';
      const isRight = keys['ArrowRight'] || keys['d'] || keys['D'] || touchSteer.current === 'right';
      const isGas = keys['ArrowUp'] || keys['w'] || keys['W'] || touchAccelerate.current;
      const isBrake = keys['ArrowDown'] || keys['s'] || keys['S'] || touchBrake.current;
      const isNitro = (keys[' '] || keys['Shift'] || touchNitro.current) && p.nitro >= 5;

      p.isBraking = isBrake;
      p.isNitroActive = isNitro && p.speed > 50;

      // 1. Acceleration and Speed Dynamics
      const accelRate = (car.acceleration / 10) * 1.6;
      let targetMaxSpeed = car.maxSpeed;

      if (p.isNitroActive) {
        targetMaxSpeed += 45; // Nitro top speed boost!
        p.nitro = Math.max(0, p.nitro - 0.45);
        racingAudio.playNitro(true);
        // Exhaust particles
        if (Math.random() < 0.6) {
          spawnParticles(p.x - 10, p.y + 36, '#38bdf8', 2, 3);
          spawnParticles(p.x + 10, p.y + 36, '#f59e0b', 2, 3);
        }
      } else {
        // Slow nitro passive regeneration
        p.nitro = Math.min(p.maxNitro, p.nitro + 0.08);
      }

      if (isGas) {
        p.speed = Math.min(targetMaxSpeed, p.speed + accelRate);
      } else if (isBrake) {
        p.speed = Math.max(35, p.speed - 3.2);
        if (Math.random() < 0.2) {
          racingAudio.playBrake();
        }
      } else {
        // Natural highway cruising / rolling friction
        if (p.speed > 80) {
          p.speed -= 0.35;
        } else if (p.speed < 70) {
          p.speed += 0.2;
        }
      }

      // Update engine audio frequency
      racingAudio.updateEngine(p.speed, isGas || p.isNitroActive);

      // 2. Lateral Steering Dynamics
      const handlingRate = (car.handling / 10) * 5.2 * (p.speed / 130);
      if (isLeft) {
        p.x -= handlingRate;
        p.steerAngle = Math.max(-0.14, p.steerAngle - 0.03);
      } else if (isRight) {
        p.x += handlingRate;
        p.steerAngle = Math.min(0.14, p.steerAngle + 0.03);
      } else {
        // Auto-center chassis tilt
        p.steerAngle *= 0.75;
      }

      // Road boundary clamping
      const canvasEl = document.getElementById('race-canvas-container');
      const canvasWidth = canvasEl ? canvasEl.clientWidth : 800;
      const centerX = canvasWidth / 2;
      const actualRoadW = Math.min(ROAD_WIDTH, canvasWidth - 40);
      const roadLeft = centerX - actualRoadW / 2;
      const roadRight = centerX + actualRoadW / 2;

      const minX = roadLeft + 22;
      const maxX = roadRight - 22;

      if (p.x < minX) {
        p.x = minX;
        p.speed *= 0.98; // curb drag
        spawnParticles(p.x - 14, p.y + 20, '#cbd5e1', 2, 2);
      } else if (p.x > maxX) {
        p.x = maxX;
        p.speed *= 0.98;
        spawnParticles(p.x + 14, p.y + 20, '#cbd5e1', 2, 2);
      }

      // 3. Road scrolling
      const scrollStep = (p.speed / 360) * 28;
      roadOffsetRef.current += scrollStep;

      // 4. Invincible countdown
      if (p.invincibleTimer > 0) {
        p.invincibleTimer--;
      }

      // 5. Traffic Movement & Spawning
      const traffic = trafficRef.current;
      const trafficSpeedRatio = scrollStep;

      for (let i = 0; i < traffic.length; i++) {
        const tv = traffic[i];
        // Relative vertical movement: (player.speed - tv.speed)
        const relSpeed = (p.speed - tv.speed) * 0.12;
        tv.y += relSpeed;

        // Near Miss Detection (Overtaking closely)
        if (!tv.isOvertaken && tv.y > p.y && tv.y < p.y + 80) {
          const laneX = roadLeft + tv.lane * (actualRoadW / 4) + (actualRoadW / 4) / 2;
          const distLat = Math.abs(p.x - laneX);

          if (distLat < 52) {
            tv.isOvertaken = true;
            triggerBonus('Опасный обгон!', 100, p.x, p.y - 30, '#38bdf8');
          }
        }

        // Collision Detection
        const laneX = roadLeft + tv.lane * (actualRoadW / 4) + (actualRoadW / 4) / 2;
        const colWidth = (34 + tv.width) / 2 - 4;
        const colHeight = (68 + tv.height) / 2 - 6;

        const isColliding =
          Math.abs(p.x - laneX) < colWidth &&
          Math.abs(p.y - tv.y) < colHeight;

        if (isColliding && p.invincibleTimer === 0) {
          p.health--;
          p.invincibleTimer = 65; // ~1 sec invincibility
          p.speed *= 0.55; // Sudden deceleration shock
          setScreenShake(14);
          racingAudio.playCrash();

          // Spawn collision sparks and metal fragments
          spawnParticles(p.x, p.y - 15, '#ef4444', 20, 6);
          spawnParticles(laneX, tv.y + 15, '#f59e0b', 20, 5);

          if (p.health <= 0) {
            handleGameOver();
            return;
          }
        }
      }

      // Cleanup traffic behind or way ahead
      trafficRef.current = traffic.filter((tv) => tv.y > -250 && tv.y < 900);

      // Spawn new traffic vehicle
      if (trafficRef.current.length < 4 && Math.random() < 0.035) {
        const lane = Math.floor(Math.random() * LANE_COUNT);
        // Check if lane is already occupied near spawn point
        const occupied = trafficRef.current.some((t) => t.lane === lane && t.y < -50);

        if (!occupied) {
          const types: TrafficType[] = ['sedan', 'sport', 'truck', 'taxi'];
          const type = types[Math.floor(Math.random() * types.length)];
          const colors = ['#2563eb', '#059669', '#d97706', '#475569', '#dc2626', '#7c3aed'];

          trafficRef.current.push({
            id: idCounter.current++,
            lane,
            x: 0,
            y: -140,
            speed: type === 'truck' ? 75 + Math.random() * 15 : 90 + Math.random() * 40,
            type,
            color: type === 'taxi' ? '#eab308' : colors[Math.floor(Math.random() * colors.length)],
            width: type === 'truck' ? 38 : 34,
            height: type === 'truck' ? 95 : 64,
            isOvertaken: false,
            oncoming: false,
          });
        }
      }

      // 6. Road Items (Coins, Nitro, Repair)
      const roadItems = roadItemsRef.current;
      for (let i = 0; i < roadItems.length; i++) {
        const item = roadItems[i];
        if (item.collected) continue;

        item.y += trafficSpeedRatio * 1.4;

        // Pickup collision
        const itemX = roadLeft + item.lane * (actualRoadW / 4) + (actualRoadW / 4) / 2;
        const dist = Math.hypot(p.x - itemX, p.y - item.y);

        if (dist < 34) {
          item.collected = true;

          if (item.type === 'coin') {
            setCoinsRun((cr) => cr + 1);
            setTotalCoins((tc) => {
              const next = tc + 1;
              localStorage.setItem('racing_total_coins', String(next));
              return next;
            });
            triggerBonus('Монета!', 50, itemX, item.y - 20, '#fbbf24');
            racingAudio.playCoin();
            spawnParticles(itemX, item.y, '#fde047', 12, 3);
          } else if (item.type === 'nitro') {
            p.nitro = Math.min(p.maxNitro, p.nitro + 50);
            triggerBonus('N2O Баллон!', 80, itemX, item.y - 20, '#38bdf8');
            racingAudio.playRepair();
            spawnParticles(itemX, item.y, '#38bdf8', 15, 4);
          } else if (item.type === 'repair') {
            p.health = Math.min(p.maxHealth, p.health + 1);
            triggerBonus('Ремонт +1!', 120, itemX, item.y - 20, '#10b981');
            racingAudio.playRepair();
            spawnParticles(itemX, item.y, '#10b981', 15, 4);
          }
        }
      }

      // Cleanup road items
      roadItemsRef.current = roadItems.filter((it) => it.y < 850 && !it.collected);

      // Spawn new items
      if (roadItemsRef.current.length < 3 && Math.random() < 0.025) {
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const randType = Math.random();
        const type: 'coin' | 'nitro' | 'repair' =
          randType < 0.65 ? 'coin' : randType < 0.85 ? 'nitro' : 'repair';

        roadItemsRef.current.push({
          id: idCounter.current++,
          lane,
          x: 0,
          y: -80,
          type,
          collected: false,
        });
      }

      // 7. Update Particles & Bonuses
      particlesRef.current.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
      });
      particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);

      floatingBonusesRef.current.forEach((fb) => {
        fb.y -= 1.2;
        fb.life--;
      });
      floatingBonusesRef.current = floatingBonusesRef.current.filter((fb) => fb.life > 0);

      // 8. Screen shake decay
      setScreenShake((prev) => (prev > 0 ? prev * 0.85 : 0));

      // 9. Distance & Score accumulation
      const metersTraveled = Math.floor(roadOffsetRef.current / 12);
      setDistance(metersTraveled);
      setScore((s) => s + Math.floor(p.speed / 100));

      // 10. Commit reactive states
      setRenderPlayer({ ...p });
      setRenderTraffic([...trafficRef.current]);
      setRenderItems([...roadItemsRef.current]);
      setRenderParticles([...particlesRef.current]);
      setRenderBonuses([...floatingBonusesRef.current]);
      setRenderOffset(roadOffsetRef.current);

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      racingAudio.stopEngine();
    };
  }, [gameState, activeCarConfig, triggerBonus]);

  // Handle Game Over
  const handleGameOver = useCallback(() => {
    racingAudio.stopEngine();
    setGameState('gameover');

    const metersTraveled = Math.floor(roadOffsetRef.current / 12);
    setDistance(metersTraveled);

    setBestDistance((prev) => {
      if (metersTraveled > prev) {
        localStorage.setItem('racing_best_distance', String(metersTraveled));
        return metersTraveled;
      }
      return prev;
    });

    setBestScore((prev) => {
      if (score > prev) {
        localStorage.setItem('racing_best_score', String(score));
        return score;
      }
      return prev;
    });
  }, [score]);

  // Car Selection & Purchase
  const handleSelectCar = (carId: CarId) => {
    setSelectedCarId(carId);
    localStorage.setItem('racing_car_id', carId);
  };

  const handleBuyCar = (car: CarConfig) => {
    if (totalCoins >= car.price && !unlockedCarIds.includes(car.id)) {
      const nextCoins = totalCoins - car.price;
      const nextUnlocked = [...unlockedCarIds, car.id];

      setTotalCoins(nextCoins);
      setUnlockedCarIds(nextUnlocked);
      setSelectedCarId(car.id);

      localStorage.setItem('racing_total_coins', String(nextCoins));
      localStorage.setItem('racing_unlocked_cars', JSON.stringify(nextUnlocked));
      localStorage.setItem('racing_car_id', car.id);
      racingAudio.playCoin();
    }
  };

  return (
    <div
      id="race-app"
      className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans select-none"
      style={{
        transform: screenShake > 0.5 ? `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)` : 'none',
      }}
    >
      {/* Header */}
      <header
        id="race-header"
        className="w-full flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 z-30"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase flex items-center gap-2">
              ТУРБО ГОНКИ
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                HIGHWAY RUSH
              </span>
            </h1>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Best Record */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Рекорд:</span>
            <span className="font-bold text-white font-mono">{bestDistance}m</span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400 font-mono">{totalCoins}</span>
          </div>

          {/* Garage Button */}
          <button
            id="btn-open-garage"
            type="button"
            onClick={() => setIsGarageOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all"
            title="Гараж автомобилей"
          >
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Гараж</span>
          </button>

          {/* Audio Mute */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Pause / Resume button if playing */}
          {gameState === 'playing' && (
            <button
              id="btn-pause"
              type="button"
              onClick={() => setGameState('paused')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Пауза"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <main id="race-viewport" className="relative flex-1 w-full overflow-hidden">
        <RaceCanvas
          playerCar={renderPlayer}
          carConfig={activeCarConfig}
          traffic={renderTraffic}
          roadItems={renderItems}
          particles={renderParticles}
          floatingBonuses={renderBonuses}
          roadOffset={renderOffset}
          roadWidth={ROAD_WIDTH}
        />

        {/* HUD OVERLAY (While playing) */}
        {gameState === 'playing' && (
          <div
            id="race-hud"
            className="absolute top-4 left-4 right-4 pointer-events-none flex items-start justify-between"
          >
            {/* Left HUD: Speedometer & Distance */}
            <div className="flex flex-col gap-2">
              <div className="px-3 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Скорость</div>
                  <div className="text-xl font-black text-white font-mono leading-none flex items-baseline gap-1">
                    {Math.round(renderPlayer.speed)}
                    <span className="text-[11px] font-normal text-slate-400">км/ч</span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl text-xs flex items-center gap-2">
                <span className="text-slate-400">Дистанция:</span>
                <span className="font-bold text-white font-mono">{distance}m</span>
              </div>
            </div>

            {/* Right HUD: Armor & Nitro Meter */}
            <div className="flex flex-col items-end gap-2">
              {/* Health Hearts */}
              <div className="px-3 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl flex items-center gap-1.5">
                {Array.from({ length: activeCarConfig.maxHealth }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`w-5 h-5 transition-all ${
                      idx < renderPlayer.health
                        ? 'text-rose-500 fill-rose-500 scale-100'
                        : 'text-slate-700 fill-slate-800 scale-90'
                    }`}
                  />
                ))}
              </div>

              {/* Nitro Bar */}
              <div className="px-3 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl w-36">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-bold">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Zap className="w-3 h-3" /> N2O
                  </span>
                  <span className="font-mono text-white">{Math.round(renderPlayer.nitro)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      renderPlayer.isNitroActive ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${(renderPlayer.nitro / renderPlayer.maxNitro) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start / Menu Overlay */}
        {gameState === 'menu' && (
          <div
            id="menu-overlay"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-md p-6 text-center"
          >
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-500 to-amber-400 flex items-center justify-center shadow-lg shadow-red-500/30 mb-4">
                <Flame className="w-9 h-9 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
                ТУРБО ГОНКИ
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Мчитесь по 4-полосному скоростному шоссе, обгоняйте трафик, жмите нитро и собирайте бонусы!
              </p>

              {/* Quick Car Info */}
              <div className="my-5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md font-bold text-white text-xs border border-white/15"
                    style={{ backgroundColor: activeCarConfig.color }}
                  >
                    GT
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{activeCarConfig.nameRu}</div>
                    <div className="text-xs text-slate-400">Макс. {activeCarConfig.maxSpeed} км/ч</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGarageOpen(true)}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20"
                >
                  Сменить авто
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="btn-start-race"
                  type="button"
                  onClick={startNewGame}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-black text-white bg-red-600 hover:bg-red-500 active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  СТАРТ ЗАЕЗДА
                </button>
                <button
                  id="btn-open-garage-menu"
                  type="button"
                  onClick={() => setIsGarageOpen(true)}
                  className="py-3.5 px-5 rounded-2xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <Gauge className="w-5 h-5 text-sky-400" />
                  Гараж
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div
            id="pause-overlay"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-center"
          >
            <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Гонка на паузе</h2>
              <div className="space-y-3">
                <button
                  id="btn-resume-race"
                  type="button"
                  onClick={() => setGameState('playing')}
                  className="w-full py-3 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Продолжить
                </button>
                <button
                  id="btn-restart-from-pause"
                  type="button"
                  onClick={startNewGame}
                  className="w-full py-3 rounded-2xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Заново
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div
            id="gameover-overlay"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 text-center"
          >
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                <RotateCcw className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                Авария на трассе!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ваш автомобиль исчерпал запас прочности
              </p>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Дистанция</div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">{distance}m</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Итоговые очки</div>
                  <div className="text-xl font-black text-sky-400 font-mono mt-0.5">{score}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Монеты за заезд</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" />+{coinsRun}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Лучший рекорд</div>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{bestDistance}m</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="btn-retry-race"
                  type="button"
                  onClick={startNewGame}
                  className="flex-1 py-3.5 rounded-2xl font-black text-white bg-red-600 hover:bg-red-500 active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  ПОВТОРИТЬ ЗАЕЗД
                </button>
                <button
                  id="btn-garage-gameover"
                  type="button"
                  onClick={() => setIsGarageOpen(true)}
                  className="py-3.5 px-5 rounded-2xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <Gauge className="w-5 h-5 text-sky-400" />
                  Гараж
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Touch / On-screen Controls */}
      <footer id="race-controls-footer" className="w-full bg-slate-900 border-t border-slate-800 z-30">
        <RaceControls
          onSteer={(dir) => {
            touchSteer.current = dir;
          }}
          onAccelerate={(active) => {
            touchAccelerate.current = active;
          }}
          onBrake={(active) => {
            touchBrake.current = active;
          }}
          onNitro={(active) => {
            touchNitro.current = active;
          }}
          nitro={renderPlayer.nitro}
          isNitroActive={renderPlayer.isNitroActive}
        />
      </footer>

      {/* Garage Modal */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        coins={totalCoins}
        selectedCarId={selectedCarId}
        unlockedCarIds={unlockedCarIds}
        onSelectCar={handleSelectCar}
        onBuyCar={handleBuyCar}
      />
    </div>
  );
}
