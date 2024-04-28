install:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	npx jest

serve:
	npx webpack serve --port 8080

build:
	rm -rf dist
	NODE_ENV=production npx webpack

restart:
	rm -rf dist
	NODE_ENV=production npx webpack
	npx webpack serve --port 8080

test-coverage:
	npm test -- --coverage --coverageProvider=v8