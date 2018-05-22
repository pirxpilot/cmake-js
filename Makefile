NODE_BIN = ./node_modules/.bin

check: lint test

lint:
	$(NODE_BIN)/eslint index.js lib tests

test:
	UT_LOG_LEVEL=warn $(NODE_BIN)/mocha --slow 4000 tests


