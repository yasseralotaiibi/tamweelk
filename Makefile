.PHONY: install build lint format test dev-stack db-migrate db-seed scan sbom sign deploy rollback compliance-pack

install:
	npm install

build:
	npm run build

lint:
	npm run lint

format:
	npm run format

test:
	npm run test

dev-stack:
	docker-compose up -d postgres redis

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

scan:
	npx eslint src --max-warnings=0

sbom:
	npx cyclonedx-npm --output-file sbom.json

sign:
	@if [ -z "$(ARTIFACT)" ]; then echo "ARTIFACT variable required" && exit 1; fi
	cosign sign-blob --key cosign.key $(ARTIFACT)

deploy:
	@if [ -z "$(ENV)" ]; then echo "ENV variable required" && exit 1; fi
	@echo "Deploying to $(ENV) via GitHub Actions pipeline"

rollback:
	@if [ -z "$(ENV)" ] || [ -z "$(RELEASE)" ]; then echo "ENV and RELEASE required" && exit 1; fi
	@echo "Requesting rollback to $(RELEASE) in $(ENV)"

compliance-pack:
	@echo "Trigger compliance evidence aggregation pipeline"
