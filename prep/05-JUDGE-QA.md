# SECTION 5 — Judge Preparation (50 Questions)

> Format: **Q · Why they ask · Best answer · Mistake to avoid.** Bold the one-liner you actually say out loud.

## A. Technical / "Is it just ChatGPT?" (1–12)

**1. How is this different from ChatGPT?**
- *Why:* The #1 differentiator test.
- *Best:* **"The skill gap and scores are computed by a deterministic engine against a curated role dataset — the LLM only explains those facts and can't invent skills. ChatGPT has no grounding; it guesses."**
- *Avoid:* Saying "we use better prompts." That's not a moat.

**2. How do you prevent hallucination?**
- *Why:* Judges distrust AI demos.
- *Best:* **"Three layers: deterministic matching before any AI call, a system prompt that forbids inventing facts, and schema validation of the model's output. The mentor literally refuses off-plan skills — we showed Kubernetes."**
- *Avoid:* "We tell it not to hallucinate." Show the refusal instead.

**3. What if the resume parser misreads a skill?**
- *Why:* Probing the weakest link.
- *Best:* "We normalize via a 31-skill alias dictionary (node→Node.js), do deterministic-first parsing, and fall back to Gemini only for sparse resumes. Unmatched skills still appear as evidence, never as a false gap."
- *Avoid:* Claiming it's perfect. Acknowledge the alias map is the safeguard.

**4. Why only 6 roles?**
- *Best:* **"Deliberate depth over breadth — each role is hand-curated so matching is accurate. The dataset is JSON; adding roles is minutes, not architecture."**
- *Avoid:* Sounding limited. Frame as a precision choice.

**5. How is the readiness score calculated?**
- *Best:* "Five weighted signals — technical skills 35, projects 25, experience 20, resume health 10, role alignment 10. Skill coverage is counted exactly once, so it's not double-weighted."
- *Avoid:* "The AI decides." It's deterministic math.

**6. Isn't the score arbitrary?**
- *Best:* "Every component is a transparent ratio with a visible reason. We can show why Bilal is 40 and Aisha is 87 — it's auditable, not a black box."
- *Avoid:* Defensiveness. Offer to show the breakdown.

**7. What model and why?**
- *Best:* "Gemini 1.5 Flash — low latency and JSON mode, ideal for a responsive demo. The model is swappable; our value is the grounding layer, not the model."
- *Avoid:* Over-indexing on the model.

**8. What happens if Gemini is down?**
- *Best:* "The entire scoring engine is deterministic and runs without AI — health, readiness, gap, and roadmap all work offline. Only the mentor needs the LLM, and we have a cached fallback."
- *Avoid:* "Then it breaks." It mostly doesn't.

**9. How do you handle PDF parsing failures?**
- *Best:* "pdf-parse/mammoth extraction with a 50-character floor; scanned images return a friendly 422 asking for a text PDF. No silent failures."
- *Avoid:* Ignoring scanned resumes — name the limitation.

**10. Where's the data stored?**
- *Best:* **"Nowhere. No database, no accounts. Resumes are processed in memory and discarded — privacy by design."**
- *Avoid:* Vague privacy claims.

**11. Is the matching just keyword search?**
- *Best:* "It's alias-aware canonical matching — 'express js', 'ExpressJS', 'express.js' all resolve to one skill before comparison. Plain keyword search would miss those and create false gaps."
- *Avoid:* Saying "yes, basically."

**12. How accurate is it vs. a real recruiter?**
- *Best:* "For entry-level web roles it mirrors the required-skill checklist recruiters actually screen on. It's a directional copilot, not a hiring decision — and we're explicit about that."
- *Avoid:* Overclaiming parity with humans.

## B. Product / Market (13–24)

**13. Who is this for exactly?**
- *Best:* "Final-year students and fresh grads targeting web/software roles — the people who can't afford a $100/hr coach."
- *Avoid:* "Everyone." Niche down.

**14. How is this different from LinkedIn / Jobscan?**
- *Best:* "Jobscan does keyword matching on one job. We do role-readiness + a learning roadmap + a conversational mentor — the whole 'what do I do next' loop."
- *Avoid:* Pretending competitors don't exist.

**15. Would students actually use this?**
- *Best:* "The wedge is the readiness number — one honest score answering 'am I ready?'. That's shareable and sticky; the roadmap brings them back."
- *Avoid:* No retention story.

**16. What's the business model?**
- *Best:* "Free core for students; B2B2C via universities and bootcamps who pay to give cohorts readiness tracking. Career services is a real budget line."
- *Avoid:* "We'll figure out monetization later."

**17. How do you acquire users?**
- *Best:* "University career centers and CS clubs as channels; the readiness score is inherently shareable on social."
- *Avoid:* "Go viral."

**18. What's your moat?**
- *Best:* "The curated role-skill dataset + alias dictionary + deterministic scoring. The more roles and aliases we curate, the harder we are to copy — and our advice gets more trustworthy than any pure-LLM tool."
- *Avoid:* "Our UI."

**19. Why now?**
- *Best:* "LLMs finally make conversational guidance cheap, but only if grounded. We built the grounding layer that makes it safe."
- *Avoid:* "AI is hot."

**20. What's the TAM?**
- *Best:* "Millions of CS/IT grads a year globally; career services is a multi-billion market. We start with web-dev roles and expand the dataset."
- *Avoid:* Fabricated precise numbers.

**21. How do you keep role data current?**
- *Best:* "It's versioned JSON we curate; long-term we'd mine live job postings to update required skills automatically."
- *Avoid:* "It never changes."

**22. What about non-tech roles?**
- *Best:* "Same engine, new datasets — design, data, PM are next. The architecture is role-agnostic."
- *Avoid:* Implying a rewrite is needed.

**23. Is this a feature or a company?**
- *Best:* "A company — the readiness graph for early careers. Resume analysis is the entry point, not the product."
- *Avoid:* Conceding it's a feature.

**24. What's the 10x vision?**
- *Best:* "Every student has a free, always-on career mentor that tracks their readiness from year one to first job."
- *Avoid:* Staying in resume-tool scope.

## C. Execution / Scope (25–36)

**25. How long did this take?**
- *Best:* "Built solo during the hackathon on top of a fully specced architecture — the deterministic engine is real, tested code, not slideware."
- *Avoid:* Underselling. Mention it runs end-to-end.

**26. What's actually working vs. mocked?**
- *Best:* "Parser, matching, all five scores, roadmap, and grounded mentor are real and tested. Nothing in the core flow is faked."
- *Avoid:* Demoing a mock as if real — judges punish that.

**27. Show me the code that prevents hallucination.**
- *Best:* "matchService computes have/missing in plain TypeScript before any AI; the server overwrites anything the model returns for those fields." *(Open matchService.ts.)*
- *Avoid:* Not being able to find it. Have the file ready.

**28. Did you test the scoring?**
- *Best:* "Yes — unit tests assert have ∪ missing equals required, alias resolution, and that the breakdown sums to the score."
- *Avoid:* "We tested it manually" only.

**29. What was the hardest part?**
- *Best:* "Making AI advice trustworthy. The answer was to take the decisions away from the AI and give it only verified facts."
- *Avoid:* "Tailwind config."

**30. What would you build next with more time?**
- *Best:* "AI mock interview and live job-board integration — both already scoped in our docs."
- *Avoid:* "More features" without specifics.

**31. How does it scale?**
- *Best:* "Stateless backend, no DB — horizontally trivial. Cost scales with LLM calls, which we cap and cache."
- *Avoid:* Hand-waving infrastructure.

**32. What's your test coverage?**
- *Best:* "Priority-1 coverage on the differentiator — the matching and scoring engines. UI is manually verified."
- *Avoid:* Claiming 100%.

**33. Why TypeScript/Express/React?**
- *Best:* "Fastest path to a typed, demoable full-stack app solo; types catch contract drift between engine and API."
- *Avoid:* "It's what I know" only.

**34. Is the roadmap personalized or templated?**
- *Best:* "Personalized — every milestone maps to one of *your* missing skills, ordered by a learning sequence. No missing skill, no milestone."
- *Avoid:* Calling it generic.

**35. How fast is the analysis?**
- *Best:* "Under 30 seconds end-to-end; the scoring itself is instant since it's deterministic — only structuring/mentor touch the LLM."
- *Avoid:* Promising sub-second.

**36. Could a recruiter game the score by keyword-stuffing?**
- *Best:* "Skills must resolve to canonical role skills, and project/experience signals are separate — stuffing the skills line only moves one of five components. Good instinct, though; it's why we don't score on keywords alone."
- *Avoid:* Dismissing it.

## D. Hard / Adversarial (37–50)

**37. Your mentor still uses an LLM — so it *can* hallucinate, right?**
- *Best:* "It can phrase things, but it can't invent facts: the grounding is injected, off-plan skills are refused, and output is schema-validated. We showed it declining Kubernetes and a fake AWS cert."
- *Avoid:* Claiming zero risk. Claim *bounded* risk.

**38. What if two judges upload the same resume and get different scores?**
- *Best:* "They won't for the scores — they're deterministic. Only the mentor's wording varies; the numbers are identical every run."
- *Avoid:* Not knowing. This is a strength — say it confidently.

**39. Isn't telling a student '40/100' discouraging?**
- *Best:* "We pair every hard number with a concrete next step and a roadmap, and the tone is a supportive mentor. Honesty plus a plan is more motivating than false praise."
- *Avoid:* Agreeing it's demotivating.

**40. Your project-quality score for a weak resume was 87 — isn't that misleading?**
- *Best:* "Good catch — it's high because the single project is genuinely relevant; it measures quality-per-project, not quantity. We'd add a project-count penalty next. It doesn't change the overall readiness, which correctly reads low."
- *Avoid:* Pretending it's intentional perfection. Own the rough edge.

**41. What stops a competitor copying this in a weekend?**
- *Best:* "The UI, sure. The curated dataset, alias dictionary, and calibrated scoring are months of judgment — and they compound with every role we add."
- *Avoid:* "Nothing."

**42. Why should we trust the role requirements you chose?**
- *Best:* "They're standard entry-level web-dev expectations, transparent in JSON, and editable. We're not hiding them — judges can read exactly what 'Backend Developer' requires."
- *Avoid:* "Trust us."

**43. The keyword-coverage score is low even for strong resumes — bug?**
- *Best:* "It's strict on purpose — it rewards mirroring real job-posting language. Even strong candidates can improve it, which is useful signal, not a bug."
- *Avoid:* Calling your own output broken on stage.

**44. What if a student lies on their resume?**
- *Best:* "We analyze what's written, like an ATS does. We're a preparation tool, not a verification service — and we're explicit about that."
- *Avoid:* Claiming lie-detection.

**45. How do you handle career switchers with unusual backgrounds?**
- *Best:* "The same way — match transferable skills against the target role and build a roadmap from the gaps. A maths grad targeting full-stack gets a 20-week plan, not a rejection."
- *Avoid:* "It's only for CS students."

**46. Your demo used pre-made resumes — does it work on mine?**
- *Best:* "Absolutely — upload yours right now." *(Then do it.)*
- *Avoid:* Refusing. If confident, take the live test; it's the strongest possible proof.

**47. Why no login? Don't you want retention data?**
- *Best:* "For the hackathon, frictionless + private wins trust. Accounts and a readiness-over-time graph are the first post-MVP addition."
- *Avoid:* "We didn't have time" as the only reason.

**48. What's the failure mode that embarrasses you most?**
- *Best:* "A false red ❌ on a skill the resume clearly lists — which is exactly why we built the alias dictionary and tested it first."
- *Avoid:* "Nothing can go wrong."

**49. If I gave you $50k tomorrow, what do you do?**
- *Best:* "Expand the role dataset to 50 roles, ship the AI mock interview, and pilot with two university career centers."
- *Avoid:* "Hire a team" with no plan.

**50. Why will *you* win this hackathon?**
- *Best:* **"Because we solved the hard problem everyone else hand-waved — making AI career advice trustworthy — and we can prove it live, with evidence, in 30 seconds."**
- *Avoid:* Listing features. Sell the insight.

---
## Meta-rules for Q&A
- Answer in **one confident sentence, then offer to show it.**
- When caught on a rough edge (#40, #43), **own it + state the fix** — judges reward self-awareness over defensiveness.
- Keep returning to three words: **deterministic, grounded, evidence-based.**
