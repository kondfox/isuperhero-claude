import { AbilityName, type MonsterCard } from '@isuperhero/types'

type A = AbilityName
const M = AbilityName.Management
const C = AbilityName.Communication
const O = AbilityName.Orientation
const P = AbilityName.Processing
const E = AbilityName.MovementEnergy

function monster(
  id: string,
  name: string,
  scores: [number, number, number, number, number],
): MonsterCard {
  return {
    id,
    name,
    abilities: {
      [M]: scores[0],
      [C]: scores[1],
      [O]: scores[2],
      [P]: scores[3],
      [E]: scores[4],
    } as Record<A, number>,
    imageUrl: `/images/monsters/${id}.png`,
  }
}

// Ability score order: [Management, Communication, Orientation, Processing, MovementEnergy]
// Source: card images from isuperhero-next/public/images/cards/monsters/
export const MONSTERS: MonsterCard[] = [
  monster('boyaka', 'Бояка', [3, 4, 4, 1, 2]),
  monster('lenivchik', 'Ленивчик', [4, 4, 3, 2, 2]),
  monster('oshibactik', 'Ошибастик', [2, 2, 2, 1, 2]),
  monster('suhoj', 'Сухой', [0, 0, 0, 0, 1]),
  monster('ckolzkij', 'Скользкий', [0, 0, 0, 1, 0]),
  monster('levo-pravo-ruk', 'Лево-право-рук', [1, 2, 1, 0, 1]),
  monster('ostrij', 'Острый', [1, 0, 1, 1, 0]),
  monster('toropyzhka', 'Торопыжка', [0, 0, 2, 0, 1]),
  monster('drachun', 'Драчун', [2, 3, 3, 1, 3]),
  monster('lipkij', 'Липкий', [0, 0, 0, 0, 0]),
  monster('otctavajka', 'Отставайка', [1, 2, 2, 2, 2]),
  monster('tvjordij', 'Твёрдый', [1, 1, 1, 1, 0]),
  monster('draznilka', 'Дразнилка', [1, 1, 2, 1, 1]),
  monster('myagkij', 'Мягкий', [1, 0, 0, 0, 0]),
  monster('otnimashek', 'Отнимашек', [3, 3, 3, 2, 3]),
  monster('tyazholyj', 'Тяжёлый', [0, 0, 1, 0, 0]),
  monster('grubiyanych', 'Грубияныч', [3, 3, 3, 1, 3]),
  monster('nadoedlibyj', 'Надоедливый', [2, 2, 2, 2, 2]),
  monster('pechalka', 'Печалька', [3, 3, 3, 3, 2]),
  monster('vrunishka', 'Врунишка', [2, 2, 4, 2, 2]),
  monster('kaprizulya', 'Капризуля', [4, 4, 3, 3, 3]),
  monster('negovoryasha', 'Неговоряша', [3, 1, 1, 1, 2]),
  monster('perezhivajka', 'Переживайка', [3, 3, 2, 4, 1]),
  monster('yabeda', 'Ябеда', [3, 3, 3, 1, 2]),
  monster('kislij', 'Кислый', [0, 1, 1, 1, 1]),
  monster('neponimashek', 'Непонимашек', [1, 1, 1, 2, 1]),
  monster('racteryasha', 'Растеряша', [2, 2, 2, 2, 2]),
  monster('zabyvaka', 'Забывака', [2, 2, 2, 2, 2]),
  monster('koljuchij', 'Колючий', [3, 3, 3, 3, 0]),
  monster('neposeda', 'Непоседа', [1, 0, 2, 0, 0]),
  monster('serdilka', 'Сердилка', [4, 3, 2, 3, 3]),
  monster('zavidki', 'Завидки', [2, 2, 3, 2, 2]),
  monster('krikun', 'Крикун', [3, 3, 3, 2, 2]),
  monster('neukljuzhik', 'Неуклюжик', [2, 3, 2, 0, 1]),
  monster('shumelkin', 'Шумелкин', [1, 1, 1, 1, 2]),
  monster('zhadiha', 'Жадина', [3, 3, 2, 3, 3]),
  monster('legkij', 'Лёгкий', [1, 0, 0, 0, 0]),
  monster('obidka', 'Обидка', [3, 3, 3, 3, 3]),
  monster('stesnyashka', 'Стесняшка', [3, 2, 2, 3, 2]),
  monster('zljuka', 'Злюка', [2, 2, 3, 3, 2]),
]
