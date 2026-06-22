"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginApi = exports.PluginAuth = exports.PluginClient = void 0;
exports.createPluginSdk = createPluginSdk;
__exportStar(require("./types"), exports);
var client_1 = require("./client");
Object.defineProperty(exports, "PluginClient", { enumerable: true, get: function () { return client_1.PluginClient; } });
var auth_1 = require("./auth");
Object.defineProperty(exports, "PluginAuth", { enumerable: true, get: function () { return auth_1.PluginAuth; } });
var api_1 = require("./api");
Object.defineProperty(exports, "PluginApi", { enumerable: true, get: function () { return api_1.PluginApi; } });
const client_2 = require("./client");
const auth_2 = require("./auth");
const api_2 = require("./api");
function createPluginSdk(options) {
    const client = new client_2.PluginClient(options);
    return {
        client,
        auth: new auth_2.PluginAuth(client),
        api: new api_2.PluginApi(client)
    };
}
