import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/User';
import { EmergencyContact } from '../models/EmergencyContact';
import { UserLocation } from '../models/UserLocation';
import { UserJWT } from '../dto/user-jwt.dto';
import { UserProfileUpdateDto } from '../auth-module/dto/user-profile-update.dto';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
  ) {}

  async userProfileUpdate(
    data: UserProfileUpdateDto,
    loggedInUser: UserJWT,
  ): Promise<any> {
    try {
      console.log('update data...', data);

      const user = await this.userModel.findOne({
        where: {
          id: loggedInUser.id,
        },
        include: [
          {
            model: EmergencyContact,
            as: 'emergencyContacts',
            required: false,
          },
        ],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update only the fields that are provided in the data object
      if (data.name !== undefined) user.name = data.name;
      if (data.city !== undefined) user.city = data.city;
      if (data.availableForCommunity !== undefined)
        user.availableForCommunity = data.availableForCommunity;
      if (data.availableForPaidProfessionalService !== undefined)
        user.availableForPaidProfessionalService =
          data.availableForPaidProfessionalService;
      if (data.userType !== undefined) user.userType = data.userType;
      if (data.profession !== undefined) user.profession = data.profession;
      if (data.startAudioVideoRecordOnSos !== undefined)
        user.startAudioVideoRecordOnSos = data.startAudioVideoRecordOnSos;
      if (data.streamAudioVideoOnSos !== undefined)
        user.streamAudioVideoOnSos = data.streamAudioVideoOnSos;
      if (data.broadcastAudioOnSos !== undefined)
        user.broadcastAudioOnSos = data.broadcastAudioOnSos;
      if (data.deviceId !== undefined) user.deviceId = data.deviceId; // Update deviceId

      if (data.referredBy) {
        const referredByUser = await this.userModel.findOne({
          where: { referralId: data.referredBy },
        });
        if (referredByUser) {
          user.referUserId = referredByUser.id;
        } else {
          user.referUserId = null;
        }
      }

      await user.save();

      // Handle emergency contacts if provided
      if (data.emergencyContacts) {
        await this.userEmergencyContactAdd(user.id, data.emergencyContacts);
      }

      // Handle locations if provided
      if (data.locations) {
        await this.userLocationAdd(user.id, data.locations);
      }

      // Fetch the updated user data
      const updatedUser = await this.userModel.findOne({
        where: { id: loggedInUser.id },
        include: [
          {
            model: EmergencyContact,
            as: 'emergencyContacts',
            required: false,
          },
          {
            model: User,
            required: false,
            as: 'referredBy',
            attributes: ['referralId'],
          },
        ],
      });

      // Fetch user locations separately
      const userLocations = await this.userLocationModel.findAll({
        where: { userId: loggedInUser.id },
        attributes: ['id', 'name', 'location', 'timestamp'],
      });

      const updatedUserDetails = this.formatUserResponse(
        updatedUser,
        user.token,
        userLocations,
      );

      return {
        success: true,
        message: 'User profile updated successfully',
        user: updatedUserDetails,
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new BadRequestException(error);
    }
  }

  async getEmergencyContacts(userId: number): Promise<any[]> {
    const contacts = await this.emergencyContactModel.findAll({
      where: {
        contactUserId: userId,
      },
      include: [
        {
          model: this.userModel,
          as: 'user',
          attributes: ['name', 'phoneNumber'],
        },
      ],
    });

    return contacts.map((contact) => ({
      id: contact.id,
      requesterName: contact.user.name,
      requesterPhone: contact.user.phoneNumber,
      consentGiven: contact.consentGiven,
    }));
  }

  async approveEmergencyContact(
    requestId: number,
    userId: number,
  ): Promise<void> {
    const contact = await this.emergencyContactModel.findOne({
      where: {
        id: requestId,
        contactUserId: userId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact request not found');
    }

    await contact.update({ consentGiven: true });
  }

  async removeEmergencyContact(
    requestId: number,
    userId: number,
  ): Promise<void> {
    const contact = await this.emergencyContactModel.findOne({
      where: {
        id: requestId,
        contactUserId: userId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact request not found');
    }

    await contact.destroy();
  }

  async getEmergencyContactsStatus(userId: number): Promise<any[]> {
    const contacts = await this.emergencyContactModel.findAll({
      where: { userId: userId },
      attributes: ['contactPhone', 'consentGiven'],
    });

    return contacts.map((contact) => ({
      contactPhone: contact.contactPhone,
      consentGiven: contact.consentGiven,
    }));
  }

  // Add a new method to validate a referral ID
  async validateReferral(referralId: string): Promise<{ exists: boolean }> {
    const user = await this.userModel.findOne({
      where: { referralId },
      attributes: ['id'], // Only fetch the ID to check existence
    });

    return { exists: !!user };
  }

  private formatUserResponse(
    user: any,
    token: string,
    userLocations: any[],
  ): any {
    return {
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      city: user.city,
      availableForCommunity: user.availableForCommunity,
      availableForPaidProfessionalService:
        user.availableForPaidProfessionalService,
      hasJoinedCommunity: user.hasJoinedCommunity,
      emergencyContacts: user.emergencyContacts,
      locations: userLocations.map((location) => ({
        id: location.id,
        name: location.name,
        location: location.location,
        timestamp: location.timestamp,
      })),
      startAudioVideoRecordOnSos: user.startAudioVideoRecordOnSos,
      streamAudioVideoOnSos: user.streamAudioVideoOnSos,
      broadcastAudioOnSos: user.broadcastAudioOnSos,
      token, // Include the token in the response
      referralId: user.referralId, // Include the referralId in the response
      referredBy: user.referredBy ? user.referredBy.referralId : null,
    };
  }
  async userEmergencyContactAdd(userId: number, contacts: any[]): Promise<any> {
    // Delete only the contacts that are not in the new list
    const existingContacts = await this.emergencyContactModel.findAll({
      where: { userId: userId },
    });

    const existingPhones = existingContacts.map(
      (contact) => contact.contactPhone,
    );
    const newPhones = contacts.map((contact) => contact.contactPhone);

    const phonesToDelete = existingPhones.filter(
      (phone) => !newPhones.includes(phone),
    );

    await this.emergencyContactModel.destroy({
      where: {
        userId: userId,
        contactPhone: phonesToDelete,
      },
    });

    // Update or create new contacts
    for (const contactData of contacts) {
      const user = await this.userModel.findOne({
        where: {
          phoneNumber: contactData.contactPhone,
        },
      });

      if (!user) {
        throw new ValidationException({
          [contactData.contactPhone]: [
            `Contact ${contactData.contactPhone} is not on the app`,
          ],
        });
      }

      const [contact, created] = await this.emergencyContactModel.findOrCreate({
        where: {
          userId: userId,
          contactPhone: contactData.contactPhone,
        },
        defaults: {
          contactName: contactData.contactName,
          contactPhone: contactData.contactPhone,
          isAppUser: true,
          contactUserId: user.id, // Add this line to save the contact's user ID
          consentGiven: false, // Set default consent to false
        },
      });

      if (!created) {
        // If the contact already exists, update its details
        await contact.update({
          contactName: contactData.contactName,
          isAppUser: true,
          contactUserId: user.id, // Update the contact's user ID
        });
      }
    }
    return { message: 'Emergency contacts updated successfully' };
  }

  async userLocationAdd(userId: number, locations: any[]): Promise<any> {
    // Get all existing locations for the user
    const existingLocations = await this.userLocationModel.findAll({
      where: { userId: userId },
    });

    const existingNames = existingLocations.map((location) => location.name);
    const newNames = locations.map((location) => location.name);

    // Find names to delete (existing names not in the new list)
    const namesToDelete = existingNames.filter(
      (name) => !newNames.includes(name),
    );

    // Delete locations that are not in the new list
    await this.userLocationModel.destroy({
      where: {
        userId: userId,
        name: namesToDelete,
      },
    });

    // Update or create locations
    for (const locationData of locations) {
      const location = {
        type: 'Point',
        coordinates: [
          locationData.location.coordinates[0],
          locationData.location.coordinates[1],
        ],
      };

      // Try to find an existing location with the same name
      const existingLocation = await this.userLocationModel.findOne({
        where: {
          userId: userId,
          name: locationData.name,
        },
      });

      if (existingLocation) {
        // Update existing location
        await existingLocation.update({
          location: location,
        });
      } else {
        // Create new location
        await this.userLocationModel.create({
          userId: userId,
          name: locationData.name,
          location: location,
        });
      }
    }

    return { message: 'User locations updated successfully' };
  }
}