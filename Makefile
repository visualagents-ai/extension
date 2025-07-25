.DEFAULT_GOAL := build

.PHONY: install
install:
	npm install

.PHONY: build
build:
	mkdir -p src-bex/dist && quasar build -m bex && cp -r dist/bex/* src-bex/dist/ && cp src-bex/dexie.js src-bex/dist/

.PHONY: format
format:
	eslint --fix "src-bex/*.{js,ts,vue}"
	prettier src/**/*.vue --parser=vue --write

.PHONY: lint
lint:
	eslint "src/**/*.{js,ts,vue}"
	prettier src/**/*.vue --check

.PHONY: clean
clean:
	quasar clean
	rm -rf src-bex/dist

.PHONY: update
update:
	( npm update --save; git diff package.json )

.PHONY: audit
audit:
	npm audit
