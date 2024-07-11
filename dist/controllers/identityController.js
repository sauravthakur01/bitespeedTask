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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityController = void 0;
class IdentityController {
    constructor(identityService) {
        this.identityService = identityService;
    }
    identify(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, phoneNumber } = req.body;
            if (!email && !phoneNumber) {
                res.status(400).json({ error: 'Email or phone number is required' });
                return;
            }
            try {
                const result = yield this.identityService.identify(email, phoneNumber);
                res.json({ contact: result });
            }
            catch (error) {
                res.status(500).json({ error: 'An error occurred while processing the request' });
            }
        });
    }
}
exports.IdentityController = IdentityController;
