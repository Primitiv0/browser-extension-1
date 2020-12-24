chrome/dist/popup.js:
	rollup --file $@ -c ./chrome/rollup.config.js --format iife

chrome-mailway.zip: chrome/dist/popup.js
	cd chrome && \
		zip ../$@ dist/* manifest.json popup.html
