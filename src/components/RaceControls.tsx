import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface RaceControlsProps {
  onSteer: (direction: 'left' | 'right' | null) => void;
  onAccelerate: (active: boolean) => void;
  onBrake: (active: boolean) => void;
  onNitro: (active: boolean) => void;
  nitro: number;
  isNitroActive: boolean;
}

export const RaceControls: React.FC<RaceControlsProps> = ({
  onSteer,
  onAccelerate,
  onBrake,
  onNitro,
  nitro,
  isNitroActive,
}) => {
  return (
    <div
      id="race-controls-panel"
      className="w-full max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-3 select-none"
    >
      {/* Left Steering Block */}
      <div className="flex items-center gap-2">
        <button
          id="btn-steer-left"
          type="button"
          onPointerDown={() => onSteer('left')}
          onPointerUp={() => onSteer(null)}
          onPointerLeave={() => onSteer(null)}
          className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 border border-slate-700 active:border-sky-400 text-white shadow-lg active:scale-95 transition-all select-none"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">[A / ←]</span>
        </button>

        <button
          id="btn-steer-right"
          type="button"
          onPointerDown={() => onSteer('right')}
          onPointerUp={() => onSteer(null)}
          onPointerLeave={() => onSteer(null)}
          className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 border border-slate-700 active:border-sky-400 text-white shadow-lg active:scale-95 transition-all select-none"
        >
          <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">[D / →]</span>
        </button>
      </div>

      {/* Nitro Boost Button (Center) */}
      <button
        id="btn-nitro-boost"
        type="button"
        onPointerDown={() => onNitro(true)}
        onPointerUp={() => onNitro(false)}
        onPointerLeave={() => onNitro(false)}
        disabled={nitro < 10}
        className={`flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 transition-all active:scale-95 shadow-lg select-none ${
          isNitroActive
            ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/50 scale-95 animate-pulse'
            : nitro >= 10
            ? 'bg-cyan-600/80 hover:bg-cyan-500 border-cyan-400/80 text-white shadow-cyan-500/20'
            : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        <Zap className="w-6 h-6 sm:w-7 sm:h-7" />
        <span className="text-xs font-bold tracking-wide mt-0.5">НИТРО</span>
        <span className="text-[9px] text-cyan-200 font-mono hidden sm:inline">[SPACE]</span>
      </button>

      {/* Right Pedal Block (Brake & Gas) */}
      <div className="flex items-center gap-2">
        <button
          id="btn-pedal-brake"
          type="button"
          onPointerDown={() => onBrake(true)}
          onPointerUp={() => onBrake(false)}
          onPointerLeave={() => onBrake(false)}
          className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-rose-600 border border-slate-700 active:border-rose-400 text-rose-400 active:text-white shadow-lg active:scale-95 transition-all select-none"
        >
          <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-xs font-bold mt-0.5">ТОРМОЗ</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">[S / ↓]</span>
        </button>

        <button
          id="btn-pedal-gas"
          type="button"
          onPointerDown={() => onAccelerate(true)}
          onPointerUp={() => onAccelerate(false)}
          onPointerLeave={() => onAccelerate(false)}
          className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 border border-emerald-400 text-white shadow-lg active:scale-95 transition-all select-none"
        >
          <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-xs font-black mt-0.5">ГАЗ</span>
          <span className="text-[10px] text-emerald-200 font-mono hidden sm:inline">[W / ↑]</span>
        </button>
      </div>
    </div>
  );
};
