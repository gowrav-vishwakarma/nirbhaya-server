import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserStatus } from '../models/User';
import { EmergencyContact } from '../models/EmergencyContact';
import { UserLocation } from '../models/UserLocation';
import { UserJWT } from '../dto/user-jwt.dto';
import { UserProfileUpdateDto } from '../auth-module/dto/user-profile-update.dto';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';
import { GlobalService } from 'src/global/global.service';
import { EventLog } from 'src/models/EventLog';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
    @InjectModel(EventLog)
    private readonly eventLogModel: typeof EventLog,
    private readonly globalService: GlobalService,
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
      if (data.state !== undefined) user.state = data.state;
      if (data.pincode !== undefined) user.pincode = data.pincode;
      if (data.dob !== undefined) user.dob = data.dob;
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
      if (data.defaultApp !== undefined) user.defaultApp = data.defaultApp;

      if (data.referredBy) {
        const referredByUser = await this.userModel.findOne({
          where: { referralId: data.referredBy },
        });
        if (referredByUser) {
          user.referUserId = referredByUser.id;
          await this.globalService.createReferralEntry(
            loggedInUser.id,
            referredByUser.id,
          );
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
        console.log('enterrr..here');
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
        attributes: [
          'id',
          'name',
          'location',
          'isBusinessLocation',
          'timestamp',
        ],
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
      is_primary: contact.is_primary,
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
      include: [
        {
          model: User,
          as: 'contactUser',
          attributes: ['isVerified', 'IsCreatedByEmg'],
          required: false,
        },
      ],
    });

    return contacts.map((contact) => ({
      contactPhone: contact.contactPhone,
      consentGiven: contact.consentGiven,
      isVerified: contact.contactUser?.isVerified || false,
      isCreatedByEmg: contact.contactUser?.IsCreatedByEmg || false,
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
        isBusinessLocation: location.isBusinessLocation,
      })),
      startAudioVideoRecordOnSos: user.startAudioVideoRecordOnSos,
      streamAudioVideoOnSos: user.streamAudioVideoOnSos,
      broadcastAudioOnSos: user.broadcastAudioOnSos,
      token, // Include the token in the response
      referralId: user.referralId, // Include the referralId in the response
      referredBy: user.referredBy ? user.referredBy.referralId : null,
      isAmbassador: user.isAmbassador,
      canCreatePost: user.canCreatePost,
      id: user.id,
      state: user.state,
      dob: user.dob,
      profession: user.profession,
      pincode: user.pincode,
      businessName: user.businessName,
      whatsappNumber: user.whatsappNumber,
      defaultApp: user.defaultApp,
    };
  }
  async userEmergencyContactAdd(userId: number, contacts: any[]): Promise<any> {
    // Delete only the contacts that are not in the new list
    const existingContacts = await this.emergencyContactModel.findAll({
      where: { userId: userId },
    });

    console.log('existingContacts..........', contacts);

    const existingPhones = existingContacts.map(
      (contact) => contact.contactPhone,
    );
    const newPhones = contacts.map((contact) => contact.contactPhone);

    const phonesToDelete = existingPhones.filter(
      (phone) => !newPhones.includes(phone),
    );

    // await this.emergencyContactModel.destroy({
    //   where: {
    //     userId: userId,
    //     contactPhone: phonesToDelete,
    //   },
    // });

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
          is_primary: contactData.is_primary || false,
        },
      });

      if (!created) {
        // If the contact already exists, update its details
        await contact.update({
          contactName: contactData.contactName,
          isAppUser: true,
          contactUserId: user.id, // Update the contact's user ID
          is_primary: contactData.is_primary || false,
        });
      }
    }
    return { message: 'Emergency contacts updated successfully' };
  }

  async userLocationAdd(userId: number, locations: any[]): Promise<any> {
    console.log('entrrrr..');
    // Get all existing locations for the user
    const existingLocations = await this.userLocationModel.findAll({
      where: { userId: userId, isBusinessLocation: false },
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
        isBusinessLocation: false,
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

      // Check if isBusinessLocation is defined in locationData
      const isBusinessLocation = locationData.isBusinessLocation || false;

      // Try to find an existing location with the same name and isBusinessLocation
      const existingLocation = await this.userLocationModel.findOne({
        where: {
          userId: userId,
          name: locationData.name,
          isBusinessLocation: isBusinessLocation,
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
          isBusinessLocation: isBusinessLocation, // Include isBusinessLocation in creation
        });
        await this.globalService.updateEventCount('registerVolunteers', userId);
      }
    }
    console.log('existingLocations', existingLocations);

    return { message: 'User locations updated successfully' };
  }

  async mediaBroadcastPermissionUpdate(data) {
    return await this.userModel.update(data, {
      where: {
        id: data.userId,
      },
    });
  }

  async deleteEmergencyContact(userId: number, phoneNumber: string) {
    try {
      await this.emergencyContactModel.destroy({
        where: {
          userId: userId,
          contactPhone: phoneNumber,
        },
      });

      // if the user has not loggedin with phoneNumber then delete the user
      const user = await this.userModel.findOne({
        where: {
          phoneNumber: phoneNumber,
          isVerified: false,
          IsCreatedByEmg: true,
        },
      });
      if (user) {
        await this.userModel.destroy({ where: { phoneNumber: phoneNumber } });
      }

      return {
        success: true,
        message: 'Emergency contact deleted successfully',
      };
    } catch (error) {
      throw new error('Failed to delete emergency contact', error);
    }
  }

  async addBusinessInformation(businessInfo: any, user: any) {
    console.log('businessInfo........', businessInfo);

    const userBusinessObj = {
      businessName: businessInfo.businessName,
      whatsappNumber: businessInfo.whatsappNumber,
      businessCategory: businessInfo.businessCategory,
    };

    await this.userModel.update(userBusinessObj, {
      where: { id: user.id },
    });

    // Handle location logic
    const [location, created] = await this.userLocationModel.findOrCreate({
      where: {
        userId: user.id,
        isBusinessLocation: true,
      },
      defaults: {
        name: businessInfo.locationName,
        location: {
          type: 'Point',
          coordinates: [businessInfo.longitude, businessInfo.latitude],
        },
        isBusinessLocation: true,
      },
    });

    if (!created) {
      await location.update({
        name: businessInfo.locationName,
        location: {
          type: 'Point',
          coordinates: [businessInfo.longitude, businessInfo.latitude],
        },
      });
    }

    return {
      success: true,
      message: 'Business information updated successfully.',
      locationId: location.id,
    };
  }

  async removeBusinessInformation(user: UserJWT) {
    try {
      // Update user to remove business information
      await this.userModel.update(
        {
          businessName: null,
          whatsappNumber: null,
        },
        {
          where: { id: user.id },
        },
      );

      // Remove business location
      await this.userLocationModel.destroy({
        where: {
          userId: user.id,
          isBusinessLocation: true,
        },
      });

      return {
        success: true,
        message: 'Business information removed successfully',
      };
    } catch (error) {
      console.error('Error removing business information:', error);
      throw new BadRequestException('Failed to remove business information');
    }
  }

  async deleteAccount(userId: number, reason: string): Promise<any> {
    try {
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      const scheduledDeletion = new Date(
        now.getTime() + 90 * 24 * 60 * 60 * 1000,
      ); // 90 days from now

      // Update user status and deletion information
      await user.update({
        status: UserStatus.DELETE_REQUESTED,
        deletionReason: reason,
        deletionRequestedAt: now,
        scheduledDeletionAt: scheduledDeletion,
      });

      return {
        success: true,
        message:
          'Account deletion process initiated. Your account will be permanently deleted after 90 days.',
      };
    } catch (error) {
      throw new Error('Failed to process account deletion: ' + error.message);
    }
  }

  async cancelDeletion(userId: number): Promise<any> {
    try {
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== UserStatus.DELETE_REQUESTED) {
        throw new Error('Account is not pending deletion');
      }

      // Reactivate the account
      await user.update({
        status: UserStatus.ACTIVE,
        deletionReason: null,
        deletionRequestedAt: null,
        scheduledDeletionAt: null,
      });

      return {
        success: true,
        message: 'Account deletion cancelled successfully.',
      };
    } catch (error) {
      throw new Error('Failed to cancel account deletion: ' + error.message);
    }
  }
}
