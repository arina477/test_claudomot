# Wave 4 — B-5 Verify
typecheck/build/lint green; test:ci 63/63 (web 37 + api 26). api boots WITHOUT storage env (graceful 503 on presign — verified). Live dev-server smoke deferred (auth+storage need live backend/bucket); RTL covers component behavior (SDK+api mocked). Avatar real-upload E2E = T-5/C-2 after the founder bucket creds.
```yaml
lint: pass
typecheck: pass
build: pass
unit_tests: pass (63/63)
smoke: deferred-to-deploy
```
