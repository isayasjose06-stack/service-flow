"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient({ log: [] });
function measure(name, fn) {
    return __awaiter(this, void 0, void 0, function () {
        var times, reqCount, e_1, i, start, e_2, p50, p95, p99;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    times = [];
                    reqCount = 30;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fn()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4:
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < reqCount)) return [3 /*break*/, 11];
                    start = performance.now();
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, fn()];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 8:
                    e_2 = _a.sent();
                    console.log("".concat(name, " Failed:"), e_2.message);
                    return [3 /*break*/, 9];
                case 9:
                    times.push(performance.now() - start);
                    _a.label = 10;
                case 10:
                    i++;
                    return [3 /*break*/, 5];
                case 11:
                    times.sort(function (a, b) { return a - b; });
                    p50 = times[Math.floor(times.length * 0.5)];
                    p95 = times[Math.floor(times.length * 0.95)];
                    p99 = times[Math.floor(times.length * 0.99)];
                    console.log("[".concat(name, "] p50: ").concat(p50.toFixed(2), "ms | p95: ").concat(p95.toFixed(2), "ms | p99: ").concat(p99.toFixed(2), "ms"));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tech, client, pendingReq;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('--- STARTING DB BENCHMARKS ---');
                    return [4 /*yield*/, prisma.user.findFirst({ where: { role: 'TECHNICIAN' } })];
                case 1:
                    tech = _a.sent();
                    return [4 /*yield*/, prisma.user.findFirst({ where: { role: 'CLIENT' } })];
                case 2:
                    client = _a.sent();
                    return [4 /*yield*/, prisma.serviceRequest.findFirst({ where: { status: 'PENDING' } })];
                case 3:
                    pendingReq = _a.sent();
                    return [4 /*yield*/, measure('Admin Users List (Pagination)', function () {
                            return prisma.user.findMany({
                                skip: 0,
                                take: 50,
                                orderBy: { createdAt: 'desc' },
                                select: {
                                    id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true,
                                },
                            });
                        })];
                case 4:
                    _a.sent();
                    if (!client) return [3 /*break*/, 6];
                    return [4 /*yield*/, measure('Client Requests', function () {
                            return prisma.serviceRequest.findMany({
                                where: { clientId: client.id },
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    category: true,
                                    subcategory: true,
                                },
                            });
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    if (!tech) return [3 /*break*/, 8];
                    return [4 /*yield*/, measure('Tech Notifications List', function () {
                            return prisma.notification.findMany({
                                where: { userId: tech.id },
                                orderBy: { createdAt: 'desc' },
                                skip: 0,
                                take: 50,
                            });
                        })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    if (!pendingReq) return [3 /*break*/, 10];
                    return [4 /*yield*/, measure('Matching Query', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        SELECT u.id as \"technicianId\"\n        FROM \"User\" u\n        JOIN \"TechnicianProfile\" tp ON tp.\"userId\" = u.id\n        WHERE u.status = 'ACTIVE' \n          AND tp.\"isAvailable\" = true\n          AND tp.\"isVerified\" = true\n          AND EXISTS (\n            SELECT 1 FROM \"CoverageZone\" cz\n            WHERE cz.\"technicianProfileId\" = tp.id\n              AND cz.\"isActive\" = true\n              AND ST_DWithin(\n                cz.geom, \n                (SELECT location FROM \"ServiceRequest\" WHERE id = ", "::uuid), \n                cz.\"radiusKm\" * 1000\n              )\n          )\n      "], ["\n        SELECT u.id as \"technicianId\"\n        FROM \"User\" u\n        JOIN \"TechnicianProfile\" tp ON tp.\"userId\" = u.id\n        WHERE u.status = 'ACTIVE' \n          AND tp.\"isAvailable\" = true\n          AND tp.\"isVerified\" = true\n          AND EXISTS (\n            SELECT 1 FROM \"CoverageZone\" cz\n            WHERE cz.\"technicianProfileId\" = tp.id\n              AND cz.\"isActive\" = true\n              AND ST_DWithin(\n                cz.geom, \n                (SELECT location FROM \"ServiceRequest\" WHERE id = ", "::uuid), \n                cz.\"radiusKm\" * 1000\n              )\n          )\n      "])), pendingReq.id)];
                            });
                        }); })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10: return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });
var templateObject_1;
