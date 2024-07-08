import prisma from '../config/database';
import { Contact, ConsolidatedContact } from '../models/contact';



// export class IdentityService {
//     async identify(email: string | null, phoneNumber: string | null): Promise<ConsolidatedContact> {
//       if (!email && !phoneNumber) {
//         throw new Error('At least one of email or phoneNumber must be provided');
//       }
  
//       const relatedContacts = await this.findRelatedContacts(email, phoneNumber);
  
//       if (relatedContacts.length === 0) {
//         const newContact = await prisma.contact.create({
//           data: {
//             email,
//             phoneNumber,
//             linkPrecedence: 'primary'
//           }
//         });
//         return this.formatResponse([newContact]);
//       }
  
//       const primaryContact = relatedContacts.find(contact => contact.linkPrecedence === 'primary') || relatedContacts[0];
//       const secondaryContacts = relatedContacts.filter(contact => contact.id !== primaryContact.id);
  
//       // Check if new information is provided
//       const existingEmails = new Set(relatedContacts.map(contact => contact.email));
//       const existingPhoneNumbers = new Set(relatedContacts.map(contact => contact.phoneNumber));
  
//       if ((email && !existingEmails.has(email)) || (phoneNumber && !existingPhoneNumbers.has(phoneNumber))) {
//         const newSecondaryContact = await prisma.contact.create({
//           data: {
//             email,
//             phoneNumber,
//             linkedId: primaryContact.id,
//             linkPrecedence: 'secondary'
//           }
//         });
//         return this.formatResponse([primaryContact, ...secondaryContacts, newSecondaryContact]);
//       }
  
//       return this.formatResponse([primaryContact, ...secondaryContacts]);
//     }
  
//     private async findRelatedContacts(email: string | null, phoneNumber: string | null): Promise<Contact[]> {
//       const conditions = [];
//       if (email) conditions.push({ email });
//       if (phoneNumber) conditions.push({ phoneNumber });
  
//       const directlyRelatedContacts = await prisma.contact.findMany({
//         where: { OR: conditions, deletedAt: null }
//       });
  
//       const allRelatedIds = directlyRelatedContacts.map(contact => contact.id);
//       directlyRelatedContacts.forEach(contact => {
//         if (contact.linkedId) allRelatedIds.push(contact.linkedId);
//       });
  
//       // Find all contacts that are linked to the directly related contacts
//       const linkedContacts = await prisma.contact.findMany({
//         where: {
//           OR: [
//             { linkedId: { in: allRelatedIds }, deletedAt: null },
//             { id: { in: allRelatedIds }, deletedAt: null }
//           ]
//         }
//       });
  
//       const allContacts = [...directlyRelatedContacts, ...linkedContacts];
//       const uniqueContacts = this.removeDuplicateContacts(allContacts);
  
//       return uniqueContacts;
//     }
  
//     private removeDuplicateContacts(contacts: Contact[]): Contact[] {
//       const contactMap = new Map<number, Contact>();
//       contacts.forEach(contact => {
//         contactMap.set(contact.id, contact);
//       });
//       return Array.from(contactMap.values());
//     }
  
//     private formatResponse(contacts: Contact[]): ConsolidatedContact {
//       const primaryContact = contacts.find(contact => contact.linkPrecedence === 'primary') || contacts[0];
//       const secondaryContacts = contacts.filter(contact => contact.id !== primaryContact.id);
  
//       return {
//         primaryContactId: primaryContact.id,
//         emails: this.extractUniqueValues(contacts.map(c => c.email)),
//         phoneNumbers: this.extractUniqueValues(contacts.map(c => c.phoneNumber)),
//         secondaryContactIds: secondaryContacts.map(c => c.id)
//       };
//     }
  
//     private extractUniqueValues(values: (string | null)[]): string[] {
//       const uniqueValues: string[] = [];
//       values.forEach(value => {
//         if (value && !uniqueValues.includes(value)) {
//           uniqueValues.push(value);
//         }
//       });
//       return uniqueValues;
//     }
//   }

export class IdentityService {
    async identify(email: string | null, phoneNumber: string | null): Promise<ConsolidatedContact> {
      if (!email && !phoneNumber) {
        throw new Error('At least one of email or phoneNumber must be provided');
      }
  
      const relatedContacts = await this.findRelatedContacts(email, phoneNumber);
  
      if (relatedContacts.length === 0) {
        const newContact = await prisma.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: 'primary'
          }
        });
        return this.formatResponse([newContact]);
      }
  
      const primaryContacts = relatedContacts.filter(contact => contact.linkPrecedence === 'primary');
      let primaryContact = primaryContacts[0];
      
      if (primaryContacts.length > 1) {
        // There are two primary contacts, we need to merge them
        primaryContact = primaryContacts.reduce((earlier, current) => earlier.createdAt < current.createdAt ? earlier : current);
        const secondaryContact = primaryContacts.find(contact => contact.id !== primaryContact.id)!;
        
        await prisma.contact.update({
          where: { id: secondaryContact.id },
          data: {
            linkedId: primaryContact.id,
            linkPrecedence: 'secondary'
          }
        });
  
        relatedContacts.push(secondaryContact);
      }
  
      const secondaryContacts = relatedContacts.filter(contact => contact.id !== primaryContact.id);
  
      const existingEmails = new Set(relatedContacts.map(contact => contact.email));
      const existingPhoneNumbers = new Set(relatedContacts.map(contact => contact.phoneNumber));
  
      let isNewInfo = false;
  
      if ((email && !existingEmails.has(email)) || (phoneNumber && !existingPhoneNumbers.has(phoneNumber))) {
        isNewInfo = true;
  
        const newSecondaryContact = await prisma.contact.create({
          data: {
            email,
            phoneNumber,
            linkedId: primaryContact.id,
            linkPrecedence: 'secondary'
          }
        });
  
        secondaryContacts.push(newSecondaryContact);
      }
  
      return this.formatResponse([primaryContact, ...secondaryContacts]);
    }
  
    private async findRelatedContacts(email: string | null, phoneNumber: string | null): Promise<Contact[]> {
      const conditions = [];
      if (email) conditions.push({ email });
      if (phoneNumber) conditions.push({ phoneNumber });
  
      const directlyRelatedContacts = await prisma.contact.findMany({
        where: { OR: conditions, deletedAt: null }
      });
  
      const allRelatedIds = directlyRelatedContacts.map(contact => contact.id);
      directlyRelatedContacts.forEach(contact => {
        if (contact.linkedId) allRelatedIds.push(contact.linkedId);
      });
  
      // Find all contacts that are linked to the directly related contacts
      const linkedContacts = await prisma.contact.findMany({
        where: {
          OR: [
            { linkedId: { in: allRelatedIds }, deletedAt: null },
            { id: { in: allRelatedIds }, deletedAt: null }
          ]
        }
      });
  
      const allContacts = [...directlyRelatedContacts, ...linkedContacts];
      const uniqueContacts = this.removeDuplicateContacts(allContacts);
  
      return uniqueContacts;
    }
  
    private removeDuplicateContacts(contacts: Contact[]): Contact[] {
      const contactMap = new Map<number, Contact>();
      contacts.forEach(contact => {
        contactMap.set(contact.id, contact);
      });
      return Array.from(contactMap.values());
    }
  
    private formatResponse(contacts: Contact[]): ConsolidatedContact {
      const primaryContact = contacts.find(contact => contact.linkPrecedence === 'primary') || contacts[0];
      const secondaryContacts = contacts.filter(contact => contact.id !== primaryContact.id);
  
      return {
        primaryContactId: primaryContact.id,
        emails: this.extractUniqueValues(contacts.map(c => c.email)),
        phoneNumbers: this.extractUniqueValues(contacts.map(c => c.phoneNumber)),
        secondaryContactIds: secondaryContacts.map(c => c.id)
      };
    }
  
    private extractUniqueValues(values: (string | null)[]): string[] {
      const uniqueValues: string[] = [];
      values.forEach(value => {
        if (value && !uniqueValues.includes(value)) {
          uniqueValues.push(value);
        }
      });
      return uniqueValues;
    }
  }
