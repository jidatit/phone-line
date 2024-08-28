import CryptoJS from "crypto-js";

const brandToken = "da2ab7d7-810a-41b2-be51-6547d6fdc841";
const accountToken = "36dd8a38-f12d-4fc0-8a7e-e019f724b5bb";
const authId = 400004327;
const accountId = 400000476;
const packageId = 400000234;

const hash = Math.floor(Date.now() / 1000).toString();

const authApp = CryptoJS.MD5(brandToken + hash).toString();
const authIntermediate = CryptoJS.MD5(brandToken + hash).toString();
const authAccount = CryptoJS.MD5(accountToken + authIntermediate).toString();

export { hash, authApp, authAccount, authId, accountId, packageId };

console.log("hash:", hash);
console.log("auth_app:", authApp);
console.log("auth_account:", authAccount);
console.log("auth_id:", authId);
console.log("account_id:", accountId);
console.log("package_id:", packageId);
