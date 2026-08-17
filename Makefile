.PHONY: install start demo

install:
	cd backend && npm install
	cd dashboard && npm install

start:
	@echo "Run npm start in backend and dashboard"

demo:
	./scripts/demo.sh
