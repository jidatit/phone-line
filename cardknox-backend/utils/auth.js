const CryptoJS = require("crypto-js");
require("dotenv").config();

const brandToken = process.env.VITE_BRAND_TOKEN;
const accountToken = process.env.VITE_ACCOUNT_TOKEN;
const authId = process.env.VITE_AUTH_ID;
const accountId = process.env.VITE_ACCOUNT_ID;
const packageId = process.env.VITE_PACKAGE_ID;

const hash = Math.floor(Date.now() / 1000).toString();

const authApp = CryptoJS.MD5(brandToken + hash).toString();
const authIntermediate = CryptoJS.MD5(brandToken + hash).toString();
const authAccount = CryptoJS.MD5(accountToken + authIntermediate).toString();

module.exports = {
	hash,
	authApp,
	authAccount,
	authId,
	accountId,
	packageId,
};
