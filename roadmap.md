# Placement platform upgrade — roadmap

Foundation (me)
- [ ] DB migration: profile fields, activities, roadmaps, companies (seeded), coding_submissions, project_interviews, session→activity trigger
- [ ] Nav with dropdowns (AppShell) + mobile sheet
- [ ] Shared: activities.functions.ts, readiness.ts, PageHeader/StatCard components

Batch A — Profile + Resume + Roadmap
- [ ] Expanded profile form (branch, CGPA, companies, skills w/ levels, internships, certs, achievements)
- [ ] /resume upload (PDF/text) + AI parse → prefill profile
- [ ] /roadmap: readiness, strengths/weaknesses, 7/14/30-day plan (persisted)

Batch B — DSA + SQL
- [ ] /dsa list + /dsa/$slug editor, Piston runner, test cases, AI review, submissions saved
- [ ] /sql lab (sql.js), sample DBs, questions, instant results, AI explain

Batch C — Core CS + Companies + Projects
- [ ] /core-cs + /core-cs/$subject quizzes & interview Qs (DBMS/OS/CN/OOP)
- [ ] /companies + /companies/$slug dashboards, readiness %
- [ ] /projects project interview simulator w/ follow-ups

Batch D — Coach + Weak topics + History + Mock
- [ ] /coach (finish doubt chat as AI Coach, profile-aware)
- [ ] /progress: history, weak topics, retry weak questions, prev vs improved
- [ ] /mock combined adaptive flow
- [ ] Advanced feedback dimensions on results

Final
- [ ] Dashboard upgrade using readiness + new sections
- [ ] Typecheck, lint, smoke test existing rounds
