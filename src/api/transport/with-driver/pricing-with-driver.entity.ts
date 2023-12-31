import { CommonEntity } from "src/common/common.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { WithDriver } from "./with-driver.entity";

@Entity()
export class PricingWithDriver extends CommonEntity {
  @Column()
  duration: string;

  @Column()
  duration_ru: string;

  @Column()
  duration_hy: string;

  @Column()
  price: number;

  @ManyToOne(() => WithDriver, (car) => car.pricing)
  car: WithDriver;
}
