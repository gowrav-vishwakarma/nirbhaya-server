import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import AclRoles from 'src/models/AclRoles';
import { ActionExecuteParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { Transaction } from 'sequelize';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';
@Injectable()
export class updateRolePermissionHook extends BaseHook {
  constructor(
    @InjectModel(AclRoles)
    private readonly aclRoles: typeof AclRoles,
  ) {
    super();
  }
  async execute(
    previousData: ActionExecuteParams<AclRoles, any, any>,
    transaction: Transaction,
  ): Promise<any> {
    //menuRoles,menu
    const { routeRoles, route, selectedSubRoutes } = previousData.data;
    // Get all roles
    if (!routeRoles) {
      throw new ValidationException({
        Role: ['Please Select Role'],
      });
    }
    const allRoles = await this.aclRoles.findAll({
      where: {
        id: routeRoles,
      },
      transaction,
    });

    const isSubRoutesPermitted = selectedSubRoutes.length;

    for (const role of allRoles) {
      const permissions = role.permissions || { menus: [], routes: [] };

      permissions.routes = permissions.routes.filter((r) => {
        return !(r.startsWith(route + ':') || r == route);
      });

      // Merge selectedSubRoutes with role.permissions.routes
      if (isSubRoutesPermitted) {
        permissions.routes.push(route);
        permissions.routes = [
          ...new Set([...permissions.routes, ...selectedSubRoutes]),
        ];
      }

      role.permissions = permissions;
      role.changed('permissions', true);
      await role.save({ transaction });
    }

    return previousData;
  }
}
