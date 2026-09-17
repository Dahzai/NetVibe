import { CarConfig } from '../types';

export const CARS: CarConfig[] = [
  {
    id: 'lightning_gt',
    name: 'Lightning GT',
    nameRu: 'Молния GT',
    type: 'Спорткар',
    desc: 'Надежный и сбалансированный спорткар для скоростных маневров на шоссе.',
    maxSpeed: 210,
    acceleration: 7.5,
    handling: 8.0,
    maxHealth: 3,
    color: '#ef4444', // Fiery Red
    accentColor: '#f59e0b',
    price: 0,
  },
  {
    id: 'neon_phantom',
    name: 'Neon Phantom',
    nameRu: 'Неоновый Фантом',
    type: 'Гиперкар',
    desc: 'Облегченный футуристичный болид с молниеносным разгоном и турбо-динамикой.',
    maxSpeed: 260,
    acceleration: 9.8,
    handling: 9.2,
    maxHealth: 2,
    color: '#06b6d4', // Neon Cyan
    accentColor: '#38bdf8',
    price: 150,
  },
  {
    id: 'titan_4x4',
    name: 'Titan 4x4',
    nameRu: 'Титан 4x4',
    type: 'Внедорожник',
    desc: 'Бронированный монстр с усиленным каркасом, способный выдержать серию столкновений.',
    maxSpeed: 180,
    acceleration: 6.0,
    handling: 6.5,
    maxHealth: 5,
    color: '#10b981', // Emerald
    accentColor: '#34d399',
    price: 260,
  },
  {
    id: 'cipher_vortex',
    name: 'Cipher Vortex',
    nameRu: 'Вортекс Шифра',
    type: 'Прототип',
    desc: 'Легендарный болид с максимальной скоростью 280 км/ч и телепатическим управлением.',
    maxSpeed: 280,
    acceleration: 10.0,
    handling: 10.0,
    maxHealth: 4,
    color: '#a855f7', // Mystic Purple
    accentColor: '#fbbf24',
    price: 500,
  },
];
