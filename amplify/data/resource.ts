import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Employee: a
    .model({
      name: a.string().required(),
      position: a.string(),
      isActive: a.boolean().default(true),
      shifts: a.hasMany('ShiftAssignment', 'employeeId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  ShiftTemplate: a
    .model({
      name: a.string().required(),
      startTime: a.time().required(),
      endTime: a.time().required(),
      assignments: a.hasMany('ShiftAssignment', 'shiftTemplateId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  ShiftAssignment: a
    .model({
      date: a.date().required(),
      employeeId: a.id().required(),
      employee: a.belongsTo('Employee', 'employeeId'),
      shiftTemplateId: a.id().required(),
      shiftTemplate: a.belongsTo('ShiftTemplate', 'shiftTemplateId'),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});