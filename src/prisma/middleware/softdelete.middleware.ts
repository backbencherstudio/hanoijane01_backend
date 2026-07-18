import { ArrayHelper } from '../../common/helper/array.helper';
import { DateHelper } from '../../common/helper/date.helper';

const models = ['Note'];
/**
 * prisma Soft delete middleware
 * @param params
 * @param next
 * @returns
 */
export async function SoftdeleteMiddleware(params, next) {
  const date = DateHelper.now();
  // Check incoming query type
  // if (params.model == 'Note') {
  if (ArrayHelper.inArray(params.model, models)) {
    // read soft deleted data
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      // Change to findFirst - you cannot filter
      // by anything except ID / unique with findUnique
      params.action = 'findFirst';
      // Add 'deletedAt' filter
      // ID filter maintained
      params.args.where['deletedAt'] = null;
    }
    if (params.action === 'findMany') {
      // Find many queries
      if (params.args.where) {
        if (params.args.where.deletedAt == undefined) {
          // Exclude deletedAt records if they have not been explicitly requested
          params.args.where['deletedAt'] = null;
        }
      } else {
        params.args['where'] = { deletedAt: null };
      }
    }

    if (params.action == 'update') {
      // Change to updateMany - you cannot filter
      // by anything except ID / unique with findUnique
      params.action = 'updateMany';
      // Add 'deleted' filter
      // ID filter maintained
      params.args.where['deletedAt'] = false;
    }
    if (params.action == 'updateMany') {
      if (params.args.where != undefined) {
        params.args.where['deletedAt'] = false;
      } else {
        params.args['where'] = { deletedAt: false };
      }
    }

    // softdelete
    if (params.action == 'delete') {
      // Delete queries
      // Change action to an update
      params.action = 'update';
      params.args['data'] = { deletedAt: date };
    }
    if (params.action == 'deleteMany') {
      // Delete many queries
      params.action = 'updateMany';
      if (params.args.data != undefined) {
        params.args.data['deletedAt'] = true;
      } else {
        params.args['data'] = { deletedAt: date };
      }
    }
  }
  return next(params);
}
