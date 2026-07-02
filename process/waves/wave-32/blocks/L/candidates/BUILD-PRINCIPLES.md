9. When wiring a new api method into a component, add it to that component's enumerated test mock in the same commit.
   Why: An unmocked call on a vi.mock module runs the real code and breaks the env for the file's tests.
