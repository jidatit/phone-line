import CryptoJS from "crypto-js";

const brandToken = import.meta.env.VITE_BRAND_TOKEN;
const accountToken = import.meta.env.VITE_ACCOUNT_TOKEN;
const authId = import.meta.env.VITE_AUTH_ID;
const accountId = import.meta.env.VITE_ACCOUNT_ID;
const packageId = import.meta.env.VITE_PACKAGE_ID;

const hash = Math.floor(Date.now() / 1000).toString();

const authApp = CryptoJS.MD5(brandToken + hash).toString();
const authIntermediate = CryptoJS.MD5(brandToken + hash).toString();
const authAccount = CryptoJS.MD5(accountToken + authIntermediate).toString();

export { hash, authApp, authAccount, authId, accountId, packageId };
