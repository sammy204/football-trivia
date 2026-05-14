import { ref, get } from 'firebase/database'
import { db } from './firebase'


export async function getLightningQuestions({ sport }) {
  const path = `adminQuestions/${sport}/bank`
  const snapshot = await get(ref(db, path))

  if (!snapshot.exists()) {
    throw new Error(`No questions found for sport: ${sport}`)
  }

  const data = snapshot.val()
  const questions = Object.entries(data).map(([id, q]) => ({
    id,
    question: q.question,
    options: q.options, // { a, b, c, d }
    answer: q.answer,   // letter key e.g. 'a'
    difficulty: q.difficulty ?? 'medium',
    sport: q.sport ?? sport,
  }))

  return shuffle(questions)
}

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}