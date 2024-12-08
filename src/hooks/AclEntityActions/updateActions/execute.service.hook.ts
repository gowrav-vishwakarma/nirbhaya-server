import { Injectable } from '@nestjs/common';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { ActionExecuteParams } from 'src/qnatk/src';
import AclEntityActions from 'src/models/AclEntityActions';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
// import { ModelActions } from 'src/model-actions';
import AclRolePermissions from 'src/models/AclRolePermissions';
import { ModelActions } from 'src/modal-actions';
@Injectable()
export class UpdateEntityActions extends BaseHook {
  priority = 1;
  // AccountArray = defaultSchemeAccounts.SavingSchemeDefaultAccounts;

  constructor(
    @InjectModel(AclEntityActions)
    private AclEntityActionsModel: typeof AclEntityActions,
    @InjectModel(AclRolePermissions)
    private AclRolePermissionsModel: typeof AclRolePermissions,
  ) {
    super();
  }

  async execute(
    previousData: ActionExecuteParams<AclEntityActions, null, any>,
    transaction: Transaction,
  ): Promise<ActionExecuteParams<AclEntityActions, null, any>> {
    // const modelActions = ModelActions;
    // const cartwishlistActions = cartwishlistModelActions;
    // const userModelActions = userModelActions;
    const allModelActions = [
      ...this.flattenModelActions(ModelActions, 'nirbhya'),
    ];

    const existingActions = await this.AclEntityActionsModel.findAll({
      transaction,
    });

    const actionsToDelete = this.getActionsToDelete(
      existingActions,
      allModelActions,
    );
    await this.deleteActions(actionsToDelete, transaction);

    await this.syncActions(allModelActions, transaction);

    return previousData;
  }

  private flattenModelActions(modelActions, appName: string): any[] {
    const flattenedActions = [];
    for (const baseModel in modelActions) {
      const actions = modelActions[baseModel];
      for (const actionName in actions) {
        if (actions[actionName].hideInAcl) continue;
        flattenedActions.push({
          BaseModel: baseModel,
          Action: actionName,
          appName: appName,
        });
      }
    }
    return flattenedActions;
  }

  private getActionsToDelete(existingActions, allModelActions): number[] {
    return existingActions
      .filter(
        (qEntityAction) =>
          !allModelActions.some(
            (action) =>
              action.BaseModel === qEntityAction.BaseModel &&
              action.Action === qEntityAction.Action &&
              action.appName === qEntityAction.appName,
          ),
      )
      .map((qEntityAction) => qEntityAction.id);
  }

  private async deleteActions(
    actionsToDelete: number[],
    transaction: Transaction,
  ): Promise<void> {
    if (actionsToDelete.length > 0) {
      await this.AclRolePermissionsModel.destroy({
        where: { entity_action_id: actionsToDelete },
        transaction,
      });

      await this.AclEntityActionsModel.destroy({
        where: { id: actionsToDelete },
        transaction,
      });
    }
  }

  private async syncActions(
    allModelActions,
    transaction: Transaction,
  ): Promise<void> {
    for (const action of allModelActions) {
      const existingAction = await this.AclEntityActionsModel.findOne({
        where: {
          BaseModel: action.BaseModel,
          Action: action.Action,
          appName: action.appName,
        },
        transaction,
      });

      if (existingAction) {
        // Update existing action
        await existingAction.update(action, { transaction });
      } else {
        // Create new action
        await this.AclEntityActionsModel.create(action, { transaction });
      }
    }
  }
}
