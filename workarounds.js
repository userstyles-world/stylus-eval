//@ts-check
const puppeteer = require('puppeteer-core');

/** @type {[RegExp, (page: puppeteer.Page) => Promise<void>][]} */
const workArounds = [
    [/google\..*/, googlePolicy],
    [/youtube\.com/, youtubePolicy],
    [/roblox.com/, robloxRedirect],
    [/twitter\.com/, twitterRedirect],
    [/github\.com/, githubRedirect],
];

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function githubRedirect(page) {
    console.log(`Checking ${page.url()}`);
    if (page.url() === 'https://github.com/') {
        await page.goto('https://github.com/userstyles-world/userstyles.world');
    }
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
 async function twitterRedirect(page) {
     console.log(`Checking ${page.url()}`);
    if (page.url() === 'https://twitter.com/') {
        // Fox is always good!
        await page.goto('https://twitter.com/FreeplayG/');
        await page.waitForSelector('div[data-testid="UserProfileHeader_Items"]');
    }
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function robloxRedirect(page) {
    console.log(`Checking ${page.url()}`);
    if (page.url() === 'https://www.roblox.com/') {
        await page.goto('https://www.roblox.com/discover#/', {waitUntil: "networkidle0"});
    }
    await page.waitForSelector('.cookie-button-container .btn-cta-lg', {
        timeout: 5000,});
    await page.click('.cookie-button-container .btn-cta-lg');
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function googlePolicy(page) {
    console.log(`Checking ${page.url()}`);
    // Click button img + div + div > :last-child
    await page.click('img + div + div > :last-child');
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function youtubePolicy(page) {
    console.log(`Checking ${page.url()}`);
    // Click button .buttons.ytd-consent-bump-v2-lightbox > :last-child [role="button"]
    await page.click('.buttons.ytd-consent-bump-v2-lightbox > :last-child [role="button"]');
    // This is some custom button so it might take a bit of time to dissapear.
    await page.waitForTimeout(500);
}

/**
 * @param {string} url
 * @returns {(page: puppeteer.Page) => Promise<void>}
 */
function matchPage(url) {
    console.log(`Checking ${url}`);
    for (let i = 0; i < workArounds.length; i++) {
        if (workArounds[i][0].test(url)) {
            return workArounds[i][1];
        }
    }
    return null;
}

/**
 * @param {puppeteer.Page} page
 */
async function checkForWorkarounds(page) {
    let domain;
    try {
        const pageURL = new URL(page.url());
        domain = pageURL.hostname;
    } catch (e) {
        console.log(`Error parsing page URL: ${e}`);
        return;
    }
    const workAround = matchPage(domain);
    if (workAround) {
        await workAround(page);
    }
}

module.exports = {
    checkForWorkarounds
};