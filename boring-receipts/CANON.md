# Boring Receipts — Canon

The doctrine of the lab. `CANON.md` says *for whom*; [`AXES.md`](AXES.md) says
*what* (axes, gate, scoring, visual form); [`GLOSSARY.md`](GLOSSARY.md) says *in
what words*.

## 1. A receipt does not speak to a reader — it re-executes

The old question "do we write for a layperson or for an LLM in a harness?" is a
false choice. A receipt is not a text addressed to someone; it is a **command
shape made legible**. You hand its `command` to a fresh agent on another GPU and a
faithful receipt regenerates. If it does not reproduce, it self-denounces. That
property — not its prose — is what makes it trustworthy.

## 2. The gesture is the source of truth; the human layer has reading primacy

Two axes people collapse:

- **Source of truth = the re-executable gesture** (the `command` + environment).
  A receipt that cannot be reproduced is worth nothing. This is what makes a
  number *falsifiable*.
- **Reading / preservation primacy = the human-legible layer.** It is what
  survives a model/harness change (anchored in hardware, git, the clock — not in
  the reader) and what keeps the power to audit distributed.

Neither serialization generates the other. The YAML and the Markdown are **sibling
renders** of the pair `(gesture, measurement)`. The gesture is primary for *truth*;
the human layer is primary for *reading*.

## 3. The ladder is transferable trust, not technical skill

The noob→Waffle-House ladder is **not** a ladder of competence. It is a ladder of
**transferable trust**: each rung is the exact point where someone stops doing a
thing by hand and starts trusting the machine, *because the rung below proved it
reproduces*. The noob is not "who runs without an LLM" — it is whoever does not yet
trust the LLM for that specific rung. The human-legible receipt does not exist for
them to *type*; it exists for them to **distrust before delegating**.

## 4. The phármakon: the machine does not doubt

An LLM accepts a plausible receipt with the same appetite as a true one. The
machine does not suspect. "Boring" is **institutionalized suspicion**, and
suspicion needs a body. Optimizing the receipt *only* for the machine-reader
betrays the lab's reason to exist. Write for the reader who cannot be substituted;
the LLM reads for free what was written for the human, but not the reverse.

## 5. Honesty over polish

State what was skipped. A receipt with no reps is a single sample, not a
measurement. A receipt that measured speed but not quality says so plainly and
forbids itself the word "better" (see the quality gate in [`AXES.md`](AXES.md)).
No trace in a chart without a counterpart in the data.

## The standing guardrail (Giselle)

Keep this question open over the whole project:

> When you say "almost nobody validates without an LLM" — are you describing a
> fact, or **consecrating an exclusion**? Who are you willing to leave off the
> ladder so it is convenient for the machine? When a contributor's branch is
> honestly worse, does your receipt let them understand *why* and keep
> contributing — or does it distribute shame as efficiently as it claims to
> distribute the power to audit?

If the answer ever becomes "trust me," the lab has hidden power behind the word
"boring." Watch for it.
