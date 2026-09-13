# NFL Revenue Gauntlet v1 — Implementation Candidate

This package is an isolated, read-only betting research harness. It does **not** place wagers and does not treat mock data as sportsbook price truth.

## Implemented
- deterministic American/decimal/implied probability math;
- proportional, additive and power de-vigging;
- EV/fair-price/calibration metrics;
- nflverse games/schedule ingestion contract;
- leakage-safe sequential team/QB state features;
- de-vigged market moneyline as Champion baseline;
- chronological walk-forward Challenger using market + football state;
- chronological held-out isotonic calibration;
- Shadow breakout-usage hypotheses (paper-only);
- optional SportsGameOdds adapter requiring an environment secret.

## Evidence boundary
nflverse game odds are a historical **market benchmark**, not proof of the exact quote Chief could have executed at an earlier decision timestamp. Official Plays remain blocked until a verified current provider quote is ingested.

## Run
```bash
python -m pip install -e '.[dev]'
pytest -q
python -m nfl_revenue_gauntlet.pipeline --source /path/to/games.csv --output-dir output
```

Never commit provider credentials. Promote a Challenger only after time-ordered OOS improvement versus the market Champion, calibration/CLV/drawdown review, leakage regression passes, and explicit promotion review.
