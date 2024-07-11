import prisma from '../config/database';
import { Contact, ConsolidatedContact } from '../models/contact';


export class IdentityService {

  async identify(email: string | null, phoneNumber: string | null): Promise<ConsolidatedContact> {
  
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
  
    const primaryContact = relatedContacts.find(contact => contact.linkPrecedence === 'primary') || relatedContacts[0];
    const secondaryContacts = relatedContacts.filter(contact => contact.id !== primaryContact.id);
  
    // Check if the information already exists
    const emailExists = relatedContacts.some(contact => contact.email === email);
    const phoneNumberExists = relatedContacts.some(contact => contact.phoneNumber === phoneNumber);
  
    // If new information is present, create a secondary contact
    if ((!emailExists && email) || (!phoneNumberExists && phoneNumber)) {
      const newSecondaryContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id
        }
      });
      secondaryContacts.push(newSecondaryContact);
    }
  
    // Update primary/secondary contacts as needed
    for (const contact of secondaryContacts) {
      if (contact.linkPrecedence === 'primary') {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { linkPrecedence: 'secondary', linkedId: primaryContact.id }
        });
      }
    }
  
    return this.formatResponse([primaryContact, ...secondaryContacts]);
  }
  
  private async findRelatedContacts(email: string | null, phoneNumber: string | null): Promise<Contact[]> {
    const orConditions = [];
    if (email) orConditions.push({ email });
    if (phoneNumber) orConditions.push({ phoneNumber });
  
    const directlyRelatedContacts = await prisma.contact.findMany({
      where: { OR: orConditions }
    });
  
    const allRelatedIds = new Set<number>();
  
    for (const contact of directlyRelatedContacts) {
      allRelatedIds.add(contact.id);
      if (contact.linkedId) allRelatedIds.add(contact.linkedId);
    }
  
    const linkedContacts = await prisma.contact.findMany({
      where: { linkedId: { in: Array.from(allRelatedIds) } }
    });
  
    linkedContacts.forEach(contact => allRelatedIds.add(contact.id));
  
    return prisma.contact.findMany({
      where: { id: { in: Array.from(allRelatedIds) } },
      orderBy: { createdAt: 'asc' }
    });
  }
  
  private formatResponse(contacts: Contact[]): ConsolidatedContact {
    const primaryContact = contacts[0];
    const secondaryContacts = contacts.slice(1);
  
    return {
      primaryContactId: primaryContact.id,
      emails: [...new Set(contacts.map(c => c.email).filter((email): email is string => email !== null))],
      phoneNumbers: [...new Set(contacts.map(c => c.phoneNumber).filter((phone): phone is string => phone !== null))],
      secondaryContactIds: [...new Set(secondaryContacts.map(c => c.id))]
    };
  }

}


