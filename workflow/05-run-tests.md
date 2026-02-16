# run tests

## purpose

Run the required tests for recently completed tasks and the current milestone.

---

## inputs to read

- spec/tests.md (milestone test gates)
- the active milestone task file (recently completed tasks and their tests_required)

---

## procedure

1. identify recently completed tasks in the current milestone
2. collect all `tests_required` from those tasks
3. identify the milestone test gate requirements from spec/tests.md
4. run the appropriate test commands:
   - `npm test` for all tests
   - `npm run test:milestone-<id>` for milestone-specific tests
5. capture test results (pass/fail)
6. if all tests pass:
   - update milestone `test_gate.last_run_at` and `test_gate.last_result` to "pass"
7. if tests fail:
   - list failures clearly
   - for each failure, either:
     - propose a fix (if obvious)
     - create a new task in the milestone file to address it

---

## output

- test execution results (pass/fail per test)
- updated milestone test_gate metadata
- new tasks for failures (if any)

---

## stop conditions

- stop after reporting results
- stop if failures require a decision or investigation beyond obvious fixes

