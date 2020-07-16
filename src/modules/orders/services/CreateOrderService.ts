import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const findProducts = await this.productsRepository.findAllById(products);

    if (!findProducts) {
      throw new AppError('Could not find all products');
    }

    const orderProducts = findProducts.map(product => {
      const orderProduct = products.find(prod => prod.id === product.id);

      if (!orderProduct) {
        throw new AppError('Could not find product');
      }

      if (product.quantity < orderProduct.quantity) {
        throw new AppError('Insuficient products quantity');
      }

      return {
        product_id: product.id,
        quantity: orderProduct.quantity,
        price: product.price,
      };
    });

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    const loadOrder = await this.ordersRepository.findById(order.id);

    if (!loadOrder) {
      throw new AppError('Could not load order data');
    }

    return loadOrder;
  }
}

export default CreateOrderService;
