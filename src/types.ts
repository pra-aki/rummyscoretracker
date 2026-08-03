/** A single completed round. Only raw inputs are stored — scores are always
 *  recomputed, so a scoring fix retroactively corrects historical games. */
export interface Round {
  id: string
  /** Seat index of the player who declared this round. */
  declarer: number
  /** Per-seat hand value. */
  values: number[]
  /** Per-seat penalty. The declarer's penalty is always 0. */
  penalties: number[]
}

/** Derived scores for one round, plus the running totals after it. */
export interface RoundResult {
  scores: number[]
  running: number[]
}

/** In-progress round entry, before it is committed to history.
 *  Inputs are strings so the fields can be genuinely empty rather than "0". */
export interface RoundDraft {
  declarer: number | null
  values: string[]
  penalties: string[]
}
