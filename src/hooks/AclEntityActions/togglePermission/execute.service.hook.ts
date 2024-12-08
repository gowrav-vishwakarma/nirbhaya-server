import { Injectable } from '@nestjs/common';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { ActionExecuteParams } from 'src/qnatk/src';
import AclEntityActions from 'src/models/AclEntityActions';
import { TogglePermissionDTO } from './dto/toggle-permission.dto';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import AclRolePermissions from 'src/models/AclRolePermissions';
@Injectable()
export class TogglePermissionACL extends BaseHook {
  priority = 1;
  constructor(
    @InjectModel(AclRolePermissions)
    private AclRolePermissionsModel: typeof AclRolePermissions,
  ) {
    super();
  }
  async execute(
    previousData: ActionExecuteParams<
      AclEntityActions,
      TogglePermissionDTO,
      any
    >,
    transaction: Transaction,
  ): Promise<ActionExecuteParams<AclEntityActions, TogglePermissionDTO, any>> {
    const existingRecord = await this.AclRolePermissionsModel.findOne({
      where: {
        entity_action_id: previousData.data.id,
        role_id: previousData.data.role_id,
      },
      transaction,
    });
    if (!existingRecord) {
      await this.AclRolePermissionsModel.create(
        {
          entity_action_id: previousData.data.id,
          role_id: previousData.data.role_id,
          status: previousData.data.toChangeValue,
        },
        { transaction },
      );
    } else {
      await this.AclRolePermissionsModel.update(
        {
          status: previousData.data.toChangeValue,
        },
        {
          where: {
            entity_action_id: previousData.data.id,
            role_id: previousData.data.role_id,
          },
          transaction,
        },
      );
    }
    return previousData;
  }
}
