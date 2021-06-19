"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.BLEUART = void 0;
var events_1 = require("events");
var BLE_MTU = 128;
var BLEUART = /** @class */ (function (_super) {
    __extends(BLEUART, _super);
    function BLEUART(namePrefix, serviceUUID, rxUUID, txUUID) {
        if (serviceUUID === void 0) { serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"; }
        if (rxUUID === void 0) { rxUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; }
        if (txUUID === void 0) { txUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; }
        var _this = _super.call(this) || this;
        _this.readlineBuffer = [];
        _this.readlineResolve = undefined;
        _this.waitBlankResolve = undefined;
        _this.rx_buffer = "";
        _this.namePrefix = namePrefix;
        _this.serviceUUID = serviceUUID;
        _this.rxUUID = rxUUID;
        _this.txUUID = txUUID;
        return _this;
    }
    BLEUART.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, server, service, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, navigator.bluetooth.requestDevice({
                                filters: [
                                    { services: [this.serviceUUID] },
                                    { namePrefix: this.namePrefix },
                                ],
                            })];
                    case 1:
                        _a.bluetoothDevice = _d.sent();
                        this.bluetoothDevice.addEventListener("gattserverdisconnected", this.onDisconnected.bind(this));
                        return [4 /*yield*/, this.bluetoothDevice.gatt.connect()];
                    case 2:
                        server = _d.sent();
                        return [4 /*yield*/, server.getPrimaryService(this.serviceUUID)];
                    case 3:
                        service = _d.sent();
                        _b = this;
                        return [4 /*yield*/, service.getCharacteristic(this.rxUUID)];
                    case 4:
                        _b.rxChar = _d.sent();
                        _c = this;
                        return [4 /*yield*/, service.getCharacteristic(this.txUUID)];
                    case 5:
                        _c.txChar = _d.sent();
                        return [4 /*yield*/, this.txChar.startNotifications()];
                    case 6:
                        _d.sent();
                        this.txChar.addEventListener("characteristicvaluechanged", this.handleNotifications.bind(this));
                        return [2 /*return*/];
                }
            });
        });
    };
    BLEUART.prototype.onDisconnected = function (_, ev) {
        this.emit("disconnect");
    };
    BLEUART.prototype.send = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var arrayBuffe, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        arrayBuffe = new TextEncoder().encode(text);
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < arrayBuffe.length)) return [3 /*break*/, 4];
                        console.log("> write", text);
                        return [4 /*yield*/, this.rxChar.writeValue(arrayBuffe.slice(i, i + BLE_MTU))];
                    case 2:
                        _a.sent();
                        console.log("<write", text);
                        _a.label = 3;
                    case 3:
                        i += BLE_MTU;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BLEUART.prototype.sendln = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send(text + "\r\n")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BLEUART.prototype.readline = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.readlineBuffer.length === 0) {
                _this.readlineResolve = resolve;
            }
            else {
                _this.readlineResolve = undefined;
                resolve(_this.readlineBuffer.shift());
            }
        });
    };
    BLEUART.prototype.waitBlank = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.waitBlankResolve = resolve;
        });
    };
    BLEUART.prototype.clear = function () {
        this.readlineBuffer = [];
        this.rx_buffer = "";
    };
    BLEUART.prototype.handleNotifications = function (event) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var value, text, splited, i, line;
            return __generator(this, function (_c) {
                if (this.txChar) {
                    try {
                        value = event.target.value;
                        text = new TextDecoder().decode(value);
                        this.rx_buffer += text;
                        splited = this.rx_buffer.split(/\r*\n/g);
                        for (i = 0; i < splited.length - 1; ++i) {
                            line = splited.shift();
                            if (line !== undefined) {
                                if (this.readlineResolve) {
                                    this.readlineResolve(line);
                                    this.readlineResolve = undefined;
                                }
                                else {
                                    (_a = this.readlineBuffer) === null || _a === void 0 ? void 0 : _a.push(line);
                                }
                                if (this.waitBlankResolve && line === "") {
                                    this.clear();
                                    this.waitBlankResolve();
                                }
                                this.emit("receive", line);
                            }
                        }
                        this.rx_buffer = (_b = splited.shift()) !== null && _b !== void 0 ? _b : "";
                    }
                    catch (error) {
                        console.error(error);
                        this.emit("error", error);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    return BLEUART;
}(events_1.EventEmitter));
exports.BLEUART = BLEUART;
//# sourceMappingURL=ble-uart.js.map