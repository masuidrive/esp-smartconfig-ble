"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLESmartConfig = exports.SSIDItem = exports.BLEUART = void 0;
var ble_uart_1 = require("./ble-uart");
Object.defineProperty(exports, "BLEUART", { enumerable: true, get: function () { return ble_uart_1.BLEUART; } });
var SSIDItem = /** @class */ (function () {
    function SSIDItem(line) {
        var item = line.split(/,/, 3);
        this.authmode = parseInt(item[0], 10);
        this.rssi = parseInt(item[1], 10);
        this.ssid = item[2];
    }
    SSIDItem.prototype.isOpen = function () {
        return this.authmode === 0;
    };
    return SSIDItem;
}());
exports.SSIDItem = SSIDItem;
var BLESmartConfig = /** @class */ (function () {
    function BLESmartConfig(uart) {
        this.uart = uart;
    }
    BLESmartConfig.prototype.list_ssid = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, line, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = [];
                        this.uart.clear();
                        return [4 /*yield*/, this.uart.sendln("LIST_SSID")];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!true) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.uart.readline()];
                    case 3:
                        line = _a.sent();
                        console.log("[" + line + "]");
                        if (line === "")
                            return [3 /*break*/, 4];
                        item = new SSIDItem(line);
                        if (item.ssid !== "") {
                            result.push(item);
                        }
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, result];
                }
            });
        });
    };
    BLESmartConfig.prototype.test_wifi_connection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.uart.clear();
                        return [4 /*yield*/, this.uart.sendln("CHECK_WIFI")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.uart.readline()];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, this.uart.waitBlank()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, !!result.match(/^OK/)];
                }
            });
        });
    };
    BLESmartConfig.prototype.set_wifi = function (ssid, passphrase) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.uart.clear();
                        return [4 /*yield*/, this.uart.sendln("SET_WIFI " + JSON.stringify(ssid) + " " + JSON.stringify(passphrase))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.uart.readline()];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, this.uart.waitBlank()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, !!result.match(/^OK/)];
                }
            });
        });
    };
    return BLESmartConfig;
}());
exports.BLESmartConfig = BLESmartConfig;
//# sourceMappingURL=index.js.map