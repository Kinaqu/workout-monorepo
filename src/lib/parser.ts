import { Program } from "./types";

export interface ParsedLog {
  exercises: { id: string; name: string; sets: number[] }[];
  note: string;
  unmatched: string[];
}

export function parseLogText(text: string, program: Program): ParsedLog {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Строим индекс: нормализованное название → exercise id
  const nameIndex = buildNameIndex(program);

  const exercises: { id: string; name: string; sets: number[] }[] = [];
  const noteLines: string[] = [];
  const unmatched: string[] = [];

  for (const line of lines) {
    const numbers = extractNumbers(line);

    if (numbers.length === 0) {
      // Нет цифр — это заметка
      noteLines.push(line);
      continue;
    }

    const exerciseId = matchExercise(line, nameIndex);

    if (exerciseId) {
      const existing = exercises.find(e => e.id === exerciseId);
      if (existing) {
        // Дублирующая строка — добавляем подходы
        existing.sets.push(...numbers);
      } else {
        exercises.push({
          id: exerciseId,
          name: getExerciseName(exerciseId, program),
          sets: numbers,
        });
      }
    } else {
      // Есть цифры, но упражнение не распознано
      unmatched.push(line);
    }
  }

  return {
    exercises,
    note: noteLines.join(" ").trim(),
    unmatched,
  };
}

// Ищет числа в строке, убирает единицы (сек, раз, x, х)
function extractNumbers(line: string): number[] {
  const cleaned = line
    .replace(/сек|sec|раз|повт|x|х/gi, " ")
    .replace(/[^\d\s.,]/g, " ");

  const matches = cleaned.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

// Строит индекс нормализованных названий
function buildNameIndex(program: Program): Map<string, string> {
  const index = new Map<string, string>();

  for (const workout of Object.values(program.workouts)) {
    for (const exercise of workout.exercises) {
      const normalized = normalize(exercise.name);
      index.set(normalized, exercise.id);

      // Добавляем короткие варианты: "отжимания" → "отжим"
      const short = normalized.slice(0, Math.max(5, normalized.length - 2));
      if (!index.has(short)) {
        index.set(short, exercise.id);
      }
    }
  }

  return index;
}

// Ищет упражнение в строке по индексу
function matchExercise(line: string, nameIndex: Map<string, string>): string | null {
  const normalizedLine = normalize(line);

  for (const [key, id] of nameIndex.entries()) {
    if (normalizedLine.includes(key)) {
      return id;
    }
  }

  return null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getExerciseName(id: string, program: Program): string {
  for (const workout of Object.values(program.workouts)) {
    const exercise = workout.exercises.find(e => e.id === id);
    if (exercise) return exercise.name;
  }
  return id;
}