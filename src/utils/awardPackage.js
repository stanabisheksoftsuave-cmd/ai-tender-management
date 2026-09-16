// Pure helpers behind the H.3 Draft Award Recommendation lifecycle — kept out
// of AwardPackagePanel.jsx so that file only exports the component (fast
// refresh needs one export shape per file).

// Diffs one DAR ranking snapshot against the previous one — rank movement plus
// a plain-language reason, computed here rather than asked of the AI, per the
// sprint plan's "machine-computed Change Impact Analysis" requirement.
export function computeChangeImpact(prevRanking, currRanking, fmtMoney) {
  if (!prevRanking || !prevRanking.length) return null
  const prevRankOf = {}
  prevRanking.forEach((r, i) => { prevRankOf[r.id] = i + 1 })
  const prevById = Object.fromEntries(prevRanking.map(r => [r.id, r]))
  return currRanking.map((r, i) => {
    const rank = i + 1
    const wasRank = prevRankOf[r.id] ?? null
    const prevEntry = prevById[r.id]
    let reason
    if (wasRank == null) {
      reason = 'New to the ranking since the previous draft.'
    } else if (rank === wasRank) {
      const delta = prevEntry ? r.evaluated - prevEntry.evaluated : 0
      reason = Math.abs(delta) < 1
        ? 'No material change since the previous draft.'
        : delta < 0
          ? `Evaluated price reduced by ${fmtMoney(Math.abs(delta))} — rank held.`
          : `Evaluated price increased by ${fmtMoney(delta)} — rank held.`
    } else if (rank < wasRank) {
      reason = `Moved up from #${wasRank} to #${rank}.`
    } else {
      reason = `Moved down from #${wasRank} to #${rank}.`
    }
    return { id: r.id, name: r.name, rank, prevRank: wasRank, evaluated: r.evaluated, reason }
  })
}

// Called from handleSubmit so the DAR history always ends with the Final
// entry that was actually submitted — never left implicitly at "Draft".
export function finalDarEntry({ history, ranking, excluded, recommendedBidderId, fmtMoney, trigger = 'final' }) {
  const prev = history[history.length - 1]
  const snap = ranking.map(r => ({ id: r.id, name: r.name, evaluated: r.evaluated }))
  return {
    no: history.length + 1,
    at: new Date().toISOString(),
    trigger,
    status: 'Final',
    ranking: snap,
    excluded: excluded.map(b => ({ id: b.id, name: b.name })),
    recommendedBidderId,
    changeImpact: computeChangeImpact(prev?.ranking, snap, fmtMoney),
  }
}
