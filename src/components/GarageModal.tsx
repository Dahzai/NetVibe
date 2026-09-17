import React from 'react';
import { CARS } from '../utils/cars';
import { CarConfig, CarId } from '../types';
import { X, Check, Lock, Shield, Gauge, Zap, Sparkles, Coins } from 'lucide-react';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  selectedCarId: CarId;
  unlockedCarIds: CarId[];
  onSelectCar: (carId: CarId) => void;
  onBuyCar: (car: CarConfig) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  coins,
  selectedCarId,
  unlockedCarIds,
  onSelectCar,
  onBuyCar,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="garage-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none"
    >
      <div
        id="garage-modal-dialog"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Гараж Автомобилей</h2>
              <p className="text-xs text-slate-400">Выберите авто или откройте новые за монеты</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400 font-mono">{coins}</span>
            </div>
            <button
              id="btn-close-garage"
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cars List */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {CARS.map((car) => {
            const isUnlocked = unlockedCarIds.includes(car.id);
            const isSelected = selectedCarId === car.id;
            const canAfford = coins >= car.price;

            return (
              <div
                key={car.id}
                id={`car-card-${car.id}`}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-950/25 shadow-lg shadow-sky-500/10'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                {/* Visual Icon & Name */}
                <div className="flex items-center gap-4">
                  {/* Car Preview Card */}
                  <div
                    className="w-14 h-20 rounded-2xl flex items-center justify-center relative shadow-md overflow-hidden border border-white/10"
                    style={{ backgroundColor: car.color }}
                  >
                    {/* Racing stripe */}
                    <div
                      className="w-2 h-full absolute"
                      style={{ backgroundColor: car.accentColor }}
                    />
                    {/* Windshield */}
                    <div className="w-9 h-5 rounded-sm bg-slate-900 absolute top-4" />
                    {/* Headlights */}
                    <div className="w-2.5 h-1.5 bg-yellow-200 absolute top-1 left-1 rounded-xs" />
                    <div className="w-2.5 h-1.5 bg-yellow-200 absolute top-1 right-1 rounded-xs" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{car.nameRu}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {car.type}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          Выбран
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">{car.desc}</p>

                    {/* Stats Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-sky-400" /> {car.maxSpeed} км/ч
                        </div>
                        <div className="w-20 bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-sky-400 h-full rounded-full"
                            style={{ width: `${(car.maxSpeed / 280) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> Разгон {car.acceleration}/10
                        </div>
                        <div className="w-20 bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${(car.acceleration / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" /> Руль {car.handling}/10
                        </div>
                        <div className="w-20 bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${(car.handling / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-400" /> Броня {car.maxHealth}
                        </div>
                        <div className="w-20 bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${(car.maxHealth / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full sm:w-auto flex justify-end">
                  {isUnlocked ? (
                    <button
                      type="button"
                      id={`btn-select-car-${car.id}`}
                      onClick={() => onSelectCar(car.id)}
                      disabled={isSelected}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 cursor-default'
                          : 'bg-slate-700 hover:bg-slate-600 text-white shadow-md active:scale-95'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 text-sky-400" />
                          Выбран
                        </>
                      ) : (
                        'Выбрать'
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      id={`btn-buy-car-${car.id}`}
                      onClick={() => onBuyCar(car)}
                      disabled={!canAfford}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {car.price} монет
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Собирайте золотые монеты на трассе и выполняйте опасные обгоны, чтобы накопить на суперкары!
          </p>
        </div>
      </div>
    </div>
  );
};
