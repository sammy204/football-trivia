import { get, off, onValue, ref, runTransaction, set } from 'firebase/database'
import { db } from './firebase'
import { auth } from './firebase'

export const STARTING_COIN_BALANCE = 50
export const ONLINE_1V1_WAGER = 10
export const LIGHTNING_H2H_WAGER = 10
export const TEAM_PLAYER_WAGER = 10
export const TOURNAMENT_ENTRY_FEE = 10
export const TEAM_WAGER_OPTIONS = [10, 25, 50]
export const BEST_OF_THREE_WAGER = 50

function normalizeAmount(amount) {
  return Math.max(0, Math.round(Number(amount) || 0))
}

function ledgerKey(sourceId) {
  return String(sourceId || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .replace(/[.#$/[\]]/g, '-')
}

function getWalletRef(userId) {
  return ref(db, `users/${userId}/wallet`)
}

function getLedgerEntryRef(userId, sourceId) {
  return ref(db, `users/${userId}/coinLedger/${ledgerKey(sourceId)}`)
}

function getCoinBackendUrl(path) {
  const base = import.meta.env.VITE_PUSH_BACKEND_URL
    ? import.meta.env.VITE_PUSH_BACKEND_URL.replace(/\/$/, '')
    : ''
  return `${base}/api/coins/${path}`
}

function isLocalBrowser() {
  if (typeof window === 'undefined') return false
  return ['localhost', '127.0.0.1'].includes(window.location.hostname)
}

async function callCoinBackend(path, payload) {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Not signed in.')

  const token = await currentUser.getIdToken()
  const response = await fetch(getCoinBackendUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Coin request failed.')
  }
  return data
}

export async function ensureCoinWallet(userId) {
  if (!userId) return null

  if (auth.currentUser) {
    const result = await callCoinBackend('ensure', { userId })
    return result.wallet || null
  }

  const result = await runTransaction(getWalletRef(userId), (current) => {
    if (current) {
      return {
        ...current,
        balance: normalizeAmount(current.balance),
        updatedAt: Date.now(),
      }
    }

    return {
      balance: STARTING_COIN_BALANCE,
      lifetimeEarned: STARTING_COIN_BALANCE,
      lifetimeSpent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  })

  return result.snapshot.val()
}

export function listenToCoinBalance(userId, callback, onError) {
  if (!userId) {
    callback(0)
    return () => {}
  }

  ensureCoinWallet(userId).catch(onError || console.error)

  const walletRef = getWalletRef(userId)
  const handler = (snapshot) => {
    callback(normalizeAmount(snapshot.val()?.balance))
  }

  onValue(walletRef, handler, onError)
  return () => off(walletRef, 'value', handler)
}

export async function awardCoins({
  userId,
  amount,
  reason,
  sourceId,
  metadata = {},
}) {
  if (!userId) return { ok: false, balance: 0, amount: 0 }

  if (auth.currentUser) {
    return callCoinBackend('award', {
      userId,
      amount,
      reason,
      sourceId,
      metadata,
    })
  }

  const safeAmount = normalizeAmount(amount)
  if (safeAmount <= 0) {
    const wallet = await ensureCoinWallet(userId)
    return { ok: true, balance: wallet?.balance || 0, amount: 0 }
  }

  const entryRef = getLedgerEntryRef(userId, sourceId || `earn-${Date.now()}`)
  const existing = await get(entryRef)
  if (existing.exists()) {
    const wallet = await ensureCoinWallet(userId)
    return { ok: true, balance: wallet?.balance || 0, amount: 0, duplicate: true }
  }

  let nextWallet = null
  const result = await runTransaction(getWalletRef(userId), (current) => {
    const wallet = current || {
      balance: STARTING_COIN_BALANCE,
      lifetimeEarned: STARTING_COIN_BALANCE,
      lifetimeSpent: 0,
      createdAt: Date.now(),
    }

    nextWallet = {
      ...wallet,
      balance: normalizeAmount(wallet.balance) + safeAmount,
      lifetimeEarned: normalizeAmount(wallet.lifetimeEarned) + safeAmount,
      lifetimeSpent: normalizeAmount(wallet.lifetimeSpent),
      updatedAt: Date.now(),
    }

    return nextWallet
  })

  if (!result.committed) return { ok: false, balance: 0, amount: 0 }

  try {
    await set(entryRef, {
      type: 'earn',
      amount: safeAmount,
      reason,
      sourceId: sourceId || null,
      balanceAfter: result.snapshot.val()?.balance || nextWallet?.balance || 0,
      metadata,
      createdAt: Date.now(),
    })
  } catch (error) {
    console.warn('Coin awarded but ledger write failed:', error)
  }

  return {
    ok: true,
    balance: result.snapshot.val()?.balance || nextWallet?.balance || 0,
    amount: safeAmount,
  }
}

export async function spendCoins({
  userId,
  amount,
  reason,
  sourceId,
  metadata = {},
  preferLocal = false,
}) {
  if (!userId) return { ok: false, balance: 0, amount: 0 }

  if (auth.currentUser && !(preferLocal && isLocalBrowser())) {
    return callCoinBackend('spend', {
      userId,
      amount,
      reason,
      sourceId,
      metadata,
    })
  }

  const safeAmount = normalizeAmount(amount)
  if (safeAmount <= 0) {
    const wallet = await ensureCoinWallet(userId)
    return { ok: true, balance: wallet?.balance || 0, amount: 0 }
  }

  const entryRef = getLedgerEntryRef(userId, sourceId || `spend-${Date.now()}`)
  const existing = await get(entryRef)
  if (existing.exists()) {
    const wallet = await ensureCoinWallet(userId)
    return { ok: true, balance: wallet?.balance || 0, amount: 0, duplicate: true }
  }

  let insufficient = false
  const result = await runTransaction(getWalletRef(userId), (current) => {
    const wallet = current || {
      balance: STARTING_COIN_BALANCE,
      lifetimeEarned: STARTING_COIN_BALANCE,
      lifetimeSpent: 0,
      createdAt: Date.now(),
    }

    const balance = normalizeAmount(wallet.balance)
    if (balance < safeAmount) {
      insufficient = true
      return
    }

    return {
      ...wallet,
      balance: balance - safeAmount,
      lifetimeEarned: normalizeAmount(wallet.lifetimeEarned),
      lifetimeSpent: normalizeAmount(wallet.lifetimeSpent) + safeAmount,
      updatedAt: Date.now(),
    }
  })

  const balance = result.snapshot.val()?.balance || 0

  if (!result.committed || insufficient) {
    return { ok: false, balance, amount: 0, insufficient: true }
  }

  try {
    await set(entryRef, {
      type: 'spend',
      amount: safeAmount,
      reason,
      sourceId: sourceId || null,
      balanceAfter: balance,
      metadata,
      createdAt: Date.now(),
    })
  } catch (error) {
    console.warn('Coins spent but ledger write failed:', error)
  }

  return { ok: true, balance, amount: safeAmount }
}

export function calculateQuizCoinReward({ mode, score, totalQuestions }) {
  const correct = normalizeAmount(score)
  const total = normalizeAmount(totalQuestions)
  const multiplier = mode === 'daily' ? 2 : 1
  const perfectBonus = total > 0 && correct === total ? 5 : 0
  const completionBonus = total > 0 ? 1 : 0

  return completionBonus + correct * multiplier + perfectBonus
}

export function calculateSeasonalCoinReward({ score, totalQuestions, multiplier = 1 }) {
  const correct = normalizeAmount(score)
  const total = normalizeAmount(totalQuestions)
  const safeMultiplier = Math.max(1, Number(multiplier) || 1)
  const perfectBonus = total > 0 && correct === total ? 10 : 0
  const completionBonus = total > 0 ? 1 : 0

  return completionBonus + Math.round(correct * safeMultiplier) + perfectBonus
}

export function calculateLightningCoinReward({ correctAnswers, isWin, isDraw }) {
  const correct = normalizeAmount(correctAnswers)
  const matchBonus = isWin ? 10 : isDraw ? 4 : 0
  const completionBonus = correct > 0 || isWin || isDraw ? 1 : 0

  return completionBonus + correct + matchBonus
}
