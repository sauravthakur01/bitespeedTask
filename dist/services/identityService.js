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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityService = void 0;
const database_1 = __importDefault(require("../config/database"));
class IdentityService {
    identify(email, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!email && !phoneNumber) {
                throw new Error('At least one of email or phoneNumber must be provided');
            }
            const relatedContacts = yield this.findRelatedContacts(email, phoneNumber);
            if (relatedContacts.length === 0) {
                const newContact = yield database_1.default.contact.create({
                    data: {
                        email,
                        phoneNumber,
                        linkPrecedence: 'primary'
                    }
                });
                return this.formatResponse([newContact]);
            }
            const primaryContact = relatedContacts.find(contact => contact.linkPrecedence === 'primary') || relatedContacts[0];
            const secondaryContacts = relatedContacts.filter(contact => contact.id !== primaryContact.id);
            // Update primary/secondary contacts as needed
            for (const contact of secondaryContacts) {
                if (contact.linkPrecedence === 'primary') {
                    yield database_1.default.contact.update({
                        where: { id: contact.id },
                        data: { linkPrecedence: 'secondary', linkedId: primaryContact.id }
                    });
                }
            }
            return this.formatResponse([primaryContact, ...secondaryContacts]);
        });
    }
    findRelatedContacts(email, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const orConditions = [];
            if (email)
                orConditions.push({ email });
            if (phoneNumber)
                orConditions.push({ phoneNumber });
            const directlyRelatedContacts = yield database_1.default.contact.findMany({
                where: { OR: orConditions }
            });
            const allRelatedIds = new Set();
            for (const contact of directlyRelatedContacts) {
                allRelatedIds.add(contact.id);
                if (contact.linkedId)
                    allRelatedIds.add(contact.linkedId);
            }
            const linkedContacts = yield database_1.default.contact.findMany({
                where: { linkedId: { in: Array.from(allRelatedIds) } }
            });
            linkedContacts.forEach(contact => allRelatedIds.add(contact.id));
            return database_1.default.contact.findMany({
                where: { id: { in: Array.from(allRelatedIds) } },
                orderBy: { createdAt: 'asc' }
            });
        });
    }
    formatResponse(contacts) {
        const primaryContact = contacts[0];
        const secondaryContacts = contacts.slice(1);
        return {
            primaryContactId: primaryContact.id,
            emails: [...new Set(contacts.map(c => c.email).filter((email) => email !== null))],
            phoneNumbers: [...new Set(contacts.map(c => c.phoneNumber).filter((phone) => phone !== null))],
            secondaryContactIds: [...new Set(secondaryContacts.map(c => c.id))]
        };
    }
}
exports.IdentityService = IdentityService;
