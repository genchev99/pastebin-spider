"use strict";

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