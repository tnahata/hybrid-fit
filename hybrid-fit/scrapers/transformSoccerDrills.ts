export interface OldDrill {
  title: string;
  url: string;
  description: string;
  image: string;
  age: string;
  fieldSize: string;
  players: string;
  focus: string;
  difficulty: string;
  duration: string;
  goalkeeper: string;
  type: string;
}

export interface NewDrill {
  name: string;
  category: string;
  sport: string;
  focus: string;
  difficulty: string;
  description: string;
  details: {
    age: string;
    fieldSize: string;
    players: string;
    goalkeeper: string;
    type: string;
    duration: string;
  };
  durationMinutes: number;
}

function parseDurationMinutes(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function transformDrill(oldDrill: OldDrill): NewDrill {
  return {
    name: oldDrill.title,
    category: 'drill',
    sport: 'soccer',
    focus: oldDrill.focus.toLowerCase(),
    difficulty: oldDrill.difficulty.toLowerCase(),
    description: oldDrill.description,
    details: {
      age: oldDrill.age,
      fieldSize: oldDrill.fieldSize,
      players: oldDrill.players,
      goalkeeper: oldDrill.goalkeeper.toLowerCase(),
      type: oldDrill.type.toLowerCase(),
      duration: oldDrill.duration,
    },
    durationMinutes: parseDurationMinutes(oldDrill.duration),
  };
}

export function transformSoccerDrills(drills: OldDrill[]): NewDrill[] {
  return drills.map(transformDrill);
}
