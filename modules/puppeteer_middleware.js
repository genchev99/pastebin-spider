"use strict";

/**
 * Closes the exiting page and then creates new page and load the page - prevents stacking memory
 * @param page Puppeteer page instance
 * @param url The url to be loaded
 * @param opts Load options
 * @returns {Promise<any>}
 */
exports.pageGoto = (page, url, opts = {waitUntil: "domcontentloaded", timeout: 200000}) =>
    new Promise(async (resolve, reject) => {
      try {
        /* Getting the browser instance from the page */
        const browser = await page.browser();

        /* Closing the page */
        await this.pageClose(page);

        /* Checking if the page is closed */
        const isClosed = await page.isClosed();
        console.log(`Page closed status: ${isClosed.toString()}`);

        /* Creating the new page instance */
        page = await browser.newPage();

        /* Loading the new page */
        await page.goto(url, opts);

        return resolve(page);
      } catch (e) {
        /* If error is thrown the Promise will reject */
        console.error(e);

        return reject(e);
      }
    });

/**
 * Clears the resources taken from the page
 * @param page Puppeteer page instance
 * @returns {Promise<any>}
 */
exports.pageClose = page =>
    new Promise(async (resolve, reject) => {
      try {
        const isClosed = await page.isClosed();
        if (!isClosed) {
          // await page.goto("about:blank");
          await page.close();
        }
      } catch (e) {
        return reject(e);
      }

      return resolve();
    });