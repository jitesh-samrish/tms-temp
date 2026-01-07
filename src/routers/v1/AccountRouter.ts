import express from 'express';
import { AccountController } from '../../controllers/AccountController';
import { AccountRepository } from '../../repositories/AccountRepository';

const accountRouter = express.Router();

const accountRepository = new AccountRepository();
const accountController = new AccountController(accountRepository);

// Get authenticated user's account details
accountRouter.get('/', accountController.handleGetAccount);

// Delete (soft delete) authenticated user's account
accountRouter.delete('/', accountController.handleDeleteAccount);

export default accountRouter;
