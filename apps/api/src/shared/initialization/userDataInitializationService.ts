/**
 * ⚠️ User Data Initialization Service - TEMPORARILY DISABLED
 * 
 * This service uses old Goal schema fields that don't match current database.
 * Needs to be updated after Goal module schema is confirmed.
 */

export class UserDataInitializationService {
  async initializeUserData(_accountUuid: string): Promise<void> {
    console.warn('User data initialization is temporarily disabled');
    // TODO: Re-implement after schema is confirmed
  }
}

export const userDataInitializationService = new UserDataInitializationService();
