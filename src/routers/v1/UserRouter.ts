import express from 'express';
import { UserController } from '../../controllers/UserController';
import { UserService } from '../../services/UserService';
import { UserRepository } from '../../repositories/UserRepository';
import { AccountRepository } from '../../repositories/AccountRepository';

const userRouter = express.Router();

const accountRepository = new AccountRepository();
const userRepository = new UserRepository(accountRepository);

const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Get authenticated user's details
userRouter.get('/', userController.handleGetUserDetails);

// Update authenticated user's details
userRouter.put('/', userController.handleUpdateUserDetails);

// Get users by list of IDs
userRouter.post('/profiles', userController.handleGetUsersByIds);

export default userRouter;
