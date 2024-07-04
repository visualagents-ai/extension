.DEFAULT_GOAL := build

.PHONY: build
build:
	quasar build -m bex &&  cp -r dist/bex/ src-bex/dist/

.PHONY: format
format:
	eslint --fix "src/**/*.{js,ts,vue}"
	prettier src/**/*.vue --parser=vue --write

.PHONY: lint
lint:
	eslint "src/**/*.{js,ts,vue}"
	prettier src/**/*.vue --check

.PHONY: clean
clean:
	quasar clean

.PHONY: update
update:
	( npm update --save; git diff package.json )

.PHONY: audit
audit:
	npm audit
