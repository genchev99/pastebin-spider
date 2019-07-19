'use strict';

const root = require('app-root-path');
require('dotenv').config({path: `${root.path}/.env`}); /* Loading env variables */

/*Dependencies*/
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const recaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

puppeteer.use(pluginStealth());
puppeteer.use(
    recaptchaPlugin({
      provider: { id: '2captcha', token: process.env.CAPTCHA_TOKEN },
      visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    })
);

const mongoose = require("mongoose");
const connectionOpts = {useNewUrlParser: true};

/* Modules */
const middleware = require("./modules/puppeteer_middleware");

/* Models */
const pasteModel = require("./models/paste");

mongoose.connect(process.env.DATABASE_URL, connectionOpts).then(async () => {
  console.log(`Database connected on ${process.env.DATABASE_URL}`);

  const browser = await createBrowser();

  const links = await getPasteLinks(browser);
  for (const link of links) {
    await scrapeContent(browser, link);
  }

  await browser.close();

  process.exit(1);
}).catch(err => {
  console.error(err, "Database connection error");

  process.exit(1065);
});

/**
 * Scrapes the paste content as well as the additional information
 * @param browser
 * @param link
 * @returns {Promise<any>}
 */
const scrapeContent = (browser, link) => new Promise(async (resolve, reject) => {
  try {
    let page = await browser.newPage();

    page = await middleware.pageGoto(page, link);

    const paste = await page.evaluate((link) => {
      let paste = {};
      paste.content = document.querySelector("#paste_code").textContent.trim();
      paste.url = link;

      const infoLine = document
          .querySelector(".paste_box_line2")
          .textContent
          .trim()
          .replace(/\t/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/ +(?= )/g,'')
          .split(" ");

      paste.information = {
        pastedAt: document.querySelector(".paste_box_line2 span").getAttribute("title").trim(),
        visits: parseInt(infoLine[infoLine.length - 2]),
        author: infoLine[0] + infoLine[1],
        syntax: document.querySelector("#code_buttons span:not(.go_right) a").textContent.trim()
      };

      return paste;
    }, link);

    await savePaste(paste);

    await middleware.pageClose(page);

    return resolve();
  } catch (e) {
    return reject(e);
  }
});

/**
 * Saves the new paste document
 * @param paste
 * @returns {Promise<any>}
 */
const savePaste = paste => new Promise(async (resolve) => {
  try {
    await pasteModel.findOneAndUpdate(paste, {}, {
      upsert: true
    });
  } catch (e) {
    console.error(e);
  }

  return resolve();
});

/**
 * Creates new puppeteer browser instance
 * @returns {Promise<any>}
 */
const createBrowser = () => new Promise(async (resolve, reject) => {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true
  }).catch(err => {
    return reject(err);
  });

  return resolve(browser);
});

/**
 * Scrapes the paste links on the archive page
 * @param browser
 * @returns {Promise<any>}
 */
const getPasteLinks = browser => new Promise(async (resolve, reject) => {
  try {
    /* Creating new page */
    let page = await browser.newPage();

    page = await middleware.pageGoto(page, "https://pastebin.com/archive");

    /* Getting all fresh links */
    const links = await page.evaluate(() => {
      const rows = document.querySelectorAll("td:not(.td_smaller) a");
      let links = [];

      for (const row of rows) {
        links.push(row.href);
      }

      return links;
    });

    /* Clearing resources */
    await middleware.pageClose(page);

    return resolve(links);
  } catch (e) {
    return reject(e);
  }
});
