import { Request, Response } from 'express';
import { IdentityService } from '../services/identityService';

export class IdentityController {
  constructor(private identityService: IdentityService) { }

  async identify(req: Request, res: Response): Promise<void> {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      res.status(400).json({ error: 'Email or phone number is required' });
      return;
    }

    try {
      const result = await this.identityService.identify(email, phoneNumber);
      res.json({ contact: result });
    } catch (error) {
      res.status(500).json({ error: `An error occurred while processing the request ${error}` });
    }
  }
}