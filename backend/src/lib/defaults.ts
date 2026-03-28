import { Program } from "./types";

export const DEFAULT_PROGRAM: Program = {
  id: "default",
  name: "Базовая программа",
  schedule: {
    monday:    "A",
    tuesday:   "B",
    wednesday: "stretch",
    thursday:  "A",
    friday:    "B",
    saturday:  "stretch",
    sunday:    "rest",
  },
  workouts: {
    A: {
      name: "Тренировка A",
      exercises: [
        { id: "pushups",      name: "Отжимания",               type: "reps",   max_sets: 3, reps:     { min: 8,  max: 12 } },
        { id: "split_squats", name: "Болгарские сплит приседы", type: "reps",   max_sets: 3, reps:     { min: 15, max: 20 } },
        { id: "dips",         name: "Обратные отжимания",      type: "reps",   max_sets: 3, reps:     { min: 10, max: 15 } },
        { id: "squats",       name: "Приседания",              type: "reps",   max_sets: 3, reps:     { min: 12, max: 15 } },
        { id: "crunches",     name: "Скручивания на пресс",    type: "reps",   max_sets: 3, reps:     { min: 15, max: 20 } },
      ],
    },
    B: {
      name: "Тренировка B",
      exercises: [
        { id: "breathing",  name: "Диафрагмальное дыхание", type: "cycles", max_sets: 1, cycles:   { min: 5,  max: 8  } },
        { id: "dead_bug",   name: "Dead Bug",               type: "reps",   max_sets: 3, reps:     { min: 12, max: 16 } },
        { id: "bird_dog",   name: "Bird Dog",               type: "reps",   max_sets: 3, reps:     { min: 10, max: 14 } },
        { id: "side_plank", name: "Боковая планка",         type: "time",   max_sets: 3, duration: { min: 30, max: 45 } },
        { id: "hollow_body",name: "Hollow Body Hold",       type: "time",   max_sets: 3, duration: { min: 20, max: 40 } },
        { id: "balance",    name: "Баланс на одной ноге",   type: "time",   max_sets: 3, duration: { min: 40, max: 60 } },
      ],
    },
    stretch: {
      name: "Растяжка",
      exercises: [
        { id: "breath_lying",  name: "Дыхание лёжа",            type: "cycles", max_sets: 1, cycles:   { min: 5,  max: 8  } },
        { id: "lunge_stretch", name: "Выпад с растяжением",     type: "time",   max_sets: 3, duration: { min: 30, max: 40 } },
        { id: "figure_four",   name: "Поза фигура 4",           type: "time",   max_sets: 3, duration: { min: 30, max: 30 } },
        { id: "chest_wall",    name: "Растяжка грудных у стены",type: "time",   max_sets: 3, duration: { min: 30, max: 30 } },
        { id: "hamstring",     name: "Растяжка с ремнём",       type: "time",   max_sets: 3, duration: { min: 20, max: 30 } },
        { id: "cat_cow",       name: "Кошка-корова",            type: "reps",   max_sets: 2, reps:     { min: 10, max: 10 } },
        { id: "balance_stand", name: "Стоя на одной ноге",      type: "time",   max_sets: 2, duration: { min: 40, max: 40 } },
      ],
    },
  },
};