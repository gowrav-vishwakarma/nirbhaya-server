import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GovPincodeData } from '../models/GovPincodeData';
import { Sequelize, Op, WhereOptions } from 'sequelize';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(GovPincodeData)
    private govPincodeDataModel: typeof GovPincodeData,
  ) {}

  async searchCities(query: string, state: string) {
    try {
      const count = await this.govPincodeDataModel.count();
      console.log('Total records in database:', count);

      const cleanQuery = query.toLowerCase().trim();

      const baseCondition = {
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('officename')),
            'LIKE',
            `%${cleanQuery}%`,
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('statename')),
            'LIKE',
            `%${cleanQuery}%`,
          ),
        ],
      };

      const whereCondition: WhereOptions = {
        ...baseCondition,
        ...(state !== undefined && { statename: state }),
      };

      const cities = await this.govPincodeDataModel.findAll({
        where: whereCondition,
        limit: 10,
        attributes: ['id', 'officename', 'pincode', 'statename'],
        raw: true,
      });

      console.log('Search query:', cleanQuery);
      console.log('Number of results:', cities.length);

      return cities;
    } catch (err) {
      console.error('Error searching cities:', {
        error: err,
        message: err.message,
        stack: err.stack,
        query: query,
      });
      throw new Error(`Failed to search cities: ${err.message}`);
    }
  }
}
