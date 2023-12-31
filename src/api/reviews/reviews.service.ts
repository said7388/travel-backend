import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodAndDrinksService } from '../food-and-drinks/food-and-drinks.service';
import { HotelsService } from '../hotels/hotels.service';
import { MiceService } from '../mice/mice.service';
import { SurroundingService } from '../surrounding/surrounding.service';
import { ThingToDoService } from '../thing-to-do/thing-to-do.service';
import { ThingToSeeService } from '../thing-to-see/thing-to-see.service';
import { TourAccessoriesService } from '../tour-accessories/tour-accessories.service';
import { ToursService } from '../tours/tours.service';
import { CarsService } from '../transport/without-driver/without-driver.service';
import { Reviews } from './review.entity';
import { CreateReviewDto, UpdateReviewDto } from './reviews.dto';


@Injectable()
export class ReviewsService {
  constructor(
    private readonly toursRepository: ToursService,

    @Inject(forwardRef(() => TourAccessoriesService))
    private tourAccessoryRepository: TourAccessoriesService,

    @Inject(forwardRef(() => HotelsService))
    private hotelRepository: HotelsService,

    @Inject(forwardRef(() => CarsService))
    private carsRepository: CarsService,

    @Inject(forwardRef(() => ThingToSeeService))
    private thingToSeeRepository: ThingToSeeService,

    @Inject(forwardRef(() => FoodAndDrinksService))
    private foodDrinksRepository: FoodAndDrinksService,

    @Inject(forwardRef(() => ThingToDoService))
    private thingToDoRepository: ThingToDoService,

    @Inject(forwardRef(() => SurroundingService))
    private surroundingService: SurroundingService,

    @Inject(forwardRef(() => MiceService))
    private miceRepository: MiceService,

    @InjectRepository(Reviews)
    private readonly reviewsRepository: Repository<Reviews>,
  ) { }

  async create(createReviewDto: CreateReviewDto) {
    const {
      tourId,
      carId,
      hotelId,
      accessoryId,
      thingToSeeId,
      thingToDoId,
      foodAndDrinkId,
      miceId,
      surroundingId,
      ...reviews
    } = createReviewDto;

    let relations = {}

    if (tourId) {
      const findTour = await this.toursRepository.findOne(tourId);
      if (!findTour) {
        return {
          status: 404,
          message: 'Tour not found',
        }
      }
      relations['tour'] = findTour.data;
    } else if (carId) {
      const findCar = await this.carsRepository.findOneByID(carId);
      if (!findCar) {
        return {
          status: 404,
          message: 'Car not found',
        }
      }
      relations['car'] = findCar;
    } else if (hotelId) {
      const findHotel = await this.hotelRepository.findOneById(hotelId);
      if (!findHotel) {
        return {
          status: 404,
          message: 'Hotel not found',
        }
      }
      relations['hotel'] = findHotel;
    } else if (accessoryId) {
      const findAccessory = await this.tourAccessoryRepository.findOneById(accessoryId);
      if (!findAccessory) {
        return {
          status: 404,
          message: 'Accessory not found',
        }
      }
      relations['accessory'] = findAccessory;
    } else if (thingToSeeId) {
      const findThing = await this.thingToSeeRepository.findById(thingToSeeId);
      if (!findThing) {
        return {
          statustatus: 404,
          message: 'Could not find thing to see'
        };
      }
      relations['thingToSee'] = findThing;
    } else if (thingToDoId) {
      const findThing = await this.thingToDoRepository.findById(thingToDoId);
      if (!findThing) {
        return {
          statustatus: 404,
          message: 'Could not find thing to see'
        };
      }
      relations['thingToDo'] = findThing;
    } else if (foodAndDrinkId) {
      const foodAndDrink = await this.foodDrinksRepository.findById(foodAndDrinkId);
      if (!foodAndDrink) {
        return {
          statustatus: 404,
          message: 'Could not find food and drink'
        };
      }
      relations['foodAndDrink'] = foodAndDrink;
    } else if (miceId) {
      const mice = await this.miceRepository.findOneById(miceId);
      if (!mice) {
        return {
          statustatus: 404,
          message: 'Could not find mice'
        };
      }
      relations['mice'] = mice;
    } else if (surroundingId) {
      const surrounding = await this.surroundingService.findById(miceId);
      if (!surrounding) {
        return {
          statustatus: 404,
          message: 'Could not find mice'
        };
      }
      relations['surrounding'] = surrounding;
    }

    const newReview = this.reviewsRepository.create({
      ...reviews,
      ...relations,
    });

    const review = await this.reviewsRepository.save(newReview);

    return {
      message: 'Review created successfully',
      data: review,
    }
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { isActive: true },
      skip,
      take: limit,
      order: {
        id: 'DESC'
      }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findAllForAdmin(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const reviews = await this.reviewsRepository.find({
      skip,
      take: limit,
      order: {
        id: 'DESC'
      }
    });
    const total = reviews.length;
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findTourReviews(tourId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        tour: {
          id: tourId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async findCarReviews(carId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        car: {
          id: carId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async findHotelReviews(hotelId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        hotel: {
          id: hotelId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async findAccessoriesReviews(accessoriesId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        accessory: {
          id: accessoriesId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async findThingToSeeReview(thingId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        thingToSee: {
          id: thingId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async findThingToDoReview(thingId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        thingToDo: {
          id: thingId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }
  async findSurroundingReview(id: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        surrounding: {
          id: id
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async findFoodAndDrinksReview(foodId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        foodAndDrink: {
          id: foodId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async miceReview(miceId: number) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        mice: {
          id: miceId
        },
        isActive: true
      }
    });

    let avarage = reviews.reduce((acc, review) => acc + review.rating, 0) / total;

    if (Number.isNaN(avarage)) {
      avarage = 0;
    } else {
      avarage = parseInt(avarage.toFixed(1));
    }

    return {
      message: 'Reviews found successfully',
      data: reviews,
      status: 200,
      meta: {
        total: total,
        avarage: avarage,
      }
    };
  }

  async makeReviewActive(reviewId: number) {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      return {
        message: 'Review not found',
        status: 404,
      }
    }
    review.isActive = true;
    const updatedReview = await this.reviewsRepository.save(review);
    return {
      message: 'Review activated successfully',
      data: updatedReview,
    }
  }

  async update(id: number, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewsRepository.findOne({ where: { id: id } });
    if (!review) {
      return {
        message: 'Review not found',
        status: 404,
      }
    }

    const updatedReview = await this.reviewsRepository.save({
      ...review,
      ...updateReviewDto,
    });

    return {
      message: 'Review updated successfully',
      data: updatedReview,
    }
  }

  async remove(id: number) {
    const review = await this.reviewsRepository.findOne({ where: { id: id } });
    if (!review) {
      return {
        message: 'Review not found',
        status: 404,
      }
    }

    await this.reviewsRepository.remove(review);

    return {
      message: 'Review deleted successfully',
      status: 200,
    }
  }
}
