import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!(title && value && type && category)) {
      throw new AppError(
        'All fields is required: title, value, type, category',
      );
    }

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid');
    }

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    const categoryRepository = getRepository(Category);
    let categoryFromBD = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryFromBD) {
      categoryFromBD = categoryRepository.create({
        title: category,
      });
      categoryFromBD = await categoryRepository.save(categoryFromBD);
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category: categoryFromBD,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
