import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  private ordersProductsRepository: Repository<OrdersProducts>;

  constructor() {
    this.ormRepository = getRepository(Order);
    this.ordersProductsRepository = getRepository(OrdersProducts);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.ormRepository.create({ customer_id: customer.id });

    await this.ormRepository.save(order);

    const ordersProducts: OrdersProducts[] = [];

    products.forEach(async product => {
      const createOrderProducts = this.ordersProductsRepository.create({
        order_id: order.id,
        product_id: product.product_id,
        price: product.price,
        quantity: product.quantity,
      });

      ordersProducts.push(createOrderProducts);
    });

    await this.ordersProductsRepository.save(ordersProducts);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne(id);

    return order;
  }
}

export default OrdersRepository;
