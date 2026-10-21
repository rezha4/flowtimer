# Flowtimer

A personal Flowtime focus timer: work until you naturally stop, then rest as a percentage of that work.

## Language

**Session**:
A focusing/working stretch from start until stop. Time only advances while the Session is running, not while paused. A Session that meets the Session minimum counts toward the daily Session count when stopped.
_Avoid_: Focus block, work period, pomodoro

**Session minimum**:
The shortest elapsed Session duration that both earns a Break and counts as a completed Session. Default 5 minutes; user-tweaked to any whole number of minutes ≥ 1.
_Avoid_: Threshold, minimum focus

**Break**:
Rest time that starts immediately when a Session is stopped, lasting that Session's elapsed duration × the chosen rest ratio. Only earned if elapsed time meets the Session minimum; otherwise Stop returns to Idle with no Break and no count increment. May be skipped early; cannot be paused.
_Avoid_: Rest period, cooldown

**Skip**:
Ending a Break before it finishes.
_Avoid_: Cancel, dismiss, end break

**Pause**:
A Session-only state for brief interruptions (bathroom, knock, urgent stop): the person remains in the Session, but the timer does not advance until they resume or stop. Paused duration does not count toward the Break. Not available during a Break.
_Avoid_: Idle (different), suspended, away

**Idle**:
The app state when no Session or Break is active — fresh visit, after a Break is skipped, or after a Break completes. A completed Break returns to Idle; the next Session starts only when the user clicks Start.
_Avoid_: Paused, waiting

**Rest ratio**:
Integer percent from 1–100 used to compute Break length from Session elapsed duration. Default 20. Applied at Stop.
_Avoid_: Break percent, rest factor

**Session count**:
How many Sessions meeting the Session minimum have been completed today (local calendar day, rolls over at local midnight). Survives tab close. Shown as done and next (e.g. 5 done · next: 6). No list of past Sessions — the count only.
_Avoid_: Streak, score, pomodoro count, history log

**Active tab**:
The single browser tab allowed to run Sessions and Breaks. Extra tabs show that Flowtimer is already open and cannot Start or Stop until the Active tab is closed.
_Avoid_: Leader tab, lock, instance
