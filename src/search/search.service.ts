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

  async searchCities(query: string, state?: string) {
    try {
      const cleanQuery = query.toLowerCase().trim();

      const baseCondition = {
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('district')),
            'LIKE',
            `%${cleanQuery}%`,
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('statename')),
            'LIKE',
            `%${cleanQuery}%`,
          ),
          Sequelize.literal(`CAST(pincode AS CHAR) LIKE '%${cleanQuery}%'`),
        ],
      };

      const whereCondition = {
        ...baseCondition,
        ...(state && { statename: state }),
      };

      const cities = await this.govPincodeDataModel.findAll({
        where: whereCondition,
        limit: 100,
        attributes: ['id', 'district', 'pincode', 'statename'],
      });

      return cities;
    } catch (err) {
      console.error('Error searching cities:', {
        error: err,
        message: err.message,
        query: query,
      });
      throw new Error(`Failed to search cities: ${err.message}`);
    }
  }
}
