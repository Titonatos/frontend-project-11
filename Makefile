install:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	npx jest

serve:
	npx webpack serve

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test-coverage:
	npm test -- --coverage --coverageProvider=v8