# FamilyTV Makefile — SRE Automation
# Usage: make <target>
#
# Dev:     make dev, make test, make lint
# CI:      make ci, make coverage, make deploy-check
# Deploy:  make deploy-staging, make deploy-prod
# DB:      make db-push, make db-migrate
# Health:  make smoke, make health
# Utils:   make changelog, make deps-update

.PHONY: help dev build test lint test:coverage test:watch ci \
	deploy-check db-push db-migrate dbstudio \
	smoke health health:staging health:prod \
	changelog deps-update deps-audit deps-fix \
	typecheck format

# =====================================================================
# Development
# =====================================================================

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# Run all checks locally before pushing
dev:build:test:lint:typecheck
	@echo "✅ All checks passed — ready to push"

# =====================================================================
# Testing
# =====================================================================

test:
	NODE_ENV=test vitest run

test:watch:
	NODE_ENV=test vitest

test:coverage:
	NODE_ENV=test vitest run --coverage
	@echo "--- Coverage Summary ---"
	@node -e "const d=require('./coverage/coverage-summary.json'); const l=d.lines; console.log('Lines: '+l.pct+'% ('+l.covered+'/'+l.total+')')"

# =====================================================================
# Linting & Type Checking
# =====================================================================

lint:
	npx next lint --fix

typecheck:
	npx tsc --noEmit

format:
	npx next lint --fix && npx tsc --noEmit

# =====================================================================
# CI Pipeline (local mirror of GitHub Actions)
# =====================================================================

ci: lint typecheck test:coverage
	@echo "--- Running full CI pipeline locally ---"
	@echo "Lint, typecheck, build, coverage: all must pass before push"
	@npm run build
	@echo "✅ CI pipeline passed"

# =====================================================================
# Coverage Gate (used by deploy-gate workflow)
# =====================================================================

COVERAGE_THRESHOLD ?= 97
coverage/check:
	@node -e "\
		const d=require('./coverage/coverage-summary.json'); \
		const pct=d.lines.pct; \
		const thr=$(COVERAGE_THRESHOLD); \
		if(pct<thr){console.error('❌ Coverage '+pct.toFixed(2)+'% is below '+thr+'% threshold');process.exit(1);} \
		console.log('✅ Coverage: '+pct.toFixed(2)+'% (threshold: '+thr+'%)')"

# Verify PR is ready to merge (local pre-flight for release-manager)
deploy-check: lint typecheck test:coverage coverage/check
	@echo "✅ Deploy gate passed — ready to merge"

# =====================================================================
# Database (Drizzle/Neon)
# =====================================================================

db-push:
	npx drizzle-kit push

db-migrate:
	npx drizzle-kit generate
	npx drizzle-kit migrate

dbstudio:
	npx drizzle-kit studio

# =====================================================================
# Health & Smoke Tests
# =====================================================================

smoke:
	@./scripts/smoke-test.sh https://staging.familytv.vercel.app

smoke:prod
	@./scripts/smoke-test.sh https://familytv.vercel.app

health:
	@echo "Checking staging health..."
	@curl -sf https://staging.familytv.vercel.app/health && echo "✅ staging OK" || echo "❌ staging FAILED"
	@echo "Checking prod health..."
	@curl -sf https://familytv.vercel.app/health && echo "✅ prod OK" || echo "❌ prod FAILED"

# =====================================================================
# Changelog
# =====================================================================

changelog:
	@./scripts/generate-changelog.sh

changelog:SINCE=
	@./scripts/generate-changelog.sh $(or $(SINCE),$(shell git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo HEAD~50))

# =====================================================================
# Dependency Management
# =====================================================================

deps-audit:
	@npm audit --audit-level=high
	@npx npm-check-updates --upgrade --upgradeAll 2>&1 | tail -20

# Auto-update all deps and open a PR (requires gh auth for PR creation)
deps-update:
	@./scripts/deps-update-pr.sh

# Auto-fix auto-fixable vulnerabilities
deps-fix:
	@npm audit fix

# =====================================================================
# Formatting
# =====================================================================

fmt:
	@npx next lint --fix
	@npx prettier --write "src/**/*.{ts,tsx}" --ignore-path .gitignore 2>/dev/null || echo "prettier not installed"
