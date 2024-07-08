import { Contact as PrismaContact  } from "@prisma/client"

export interface Contact extends PrismaContact  {}

export interface ConsolidatedContact {
    
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];

}
