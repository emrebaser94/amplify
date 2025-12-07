import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Wohngruppe
  ResidentialGroup: a
    .model({
      name: a.string().required(),
      description: a.string(),
      isActive: a.boolean().default(true),
      shifts: a.hasMany('Shift', 'residentialGroupId'),
      weekPlans: a.hasMany('WeekPlan', 'residentialGroupId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Mitarbeiter
  Employee: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phone: a.phone(),
      position: a.string(), // z.B. "Pfleger", "Betreuer"
      maxWeeklyHours: a.float().default(40), // Maximale Wochenstunden
      isActive: a.boolean().default(true),
      shifts: a.hasMany('Shift', 'employeeId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Schicht-Definition (3 pro Tag: Früh, Spät, Nacht)
  ShiftTemplate: a
    .model({
      name: a.string().required(), // z.B. "Frühschicht", "Spätschicht", "Nachtschicht"
      startTime: a.time().required(), // z.B. "06:00"
      endTime: a.time().required(),   // z.B. "14:00"
      color: a.string(), // Farbe für UI-Darstellung
      sortOrder: a.integer().default(0), // Für Reihenfolge (Früh=1, Spät=2, Nacht=3)
      shifts: a.hasMany('Shift', 'shiftTemplateId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Tatsächliche Schicht-Zuweisung
  Shift: a
    .model({
      date: a.date().required(), // Datum der Schicht

      // Beziehungen
      employeeId: a.id().required(),
      employee: a.belongsTo('Employee', 'employeeId'),

      residentialGroupId: a.id().required(),
      residentialGroup: a.belongsTo('ResidentialGroup', 'residentialGroupId'),

      shiftTemplateId: a.id().required(),
      shiftTemplate: a.belongsTo('ShiftTemplate', 'shiftTemplateId'),

      // Überschreibe Zeiten wenn nötig (optional)
      customStartTime: a.time(),
      customEndTime: a.time(),

      // Zusätzliche Infos
      notes: a.string(),
      isConfirmed: a.boolean().default(false),
    })
    .authorization((allow) => [allow.authenticated()])
    // Index für effiziente Abfragen nach Datum und Wohngruppe
    .secondaryIndexes((index) => [
      index('residentialGroupId').sortKeys(['date']).queryField('shiftsByResidentialGroup'),
      index('employeeId').sortKeys(['date']).queryField('shiftsByEmployee'),
      index('date').queryField('shiftsByDate'),
    ]),

  // Wochenansicht-Helper (Optional - für Performance)
  WeekPlan: a
    .model({
      residentialGroupId: a.id().required(),
      residentialGroup: a.belongsTo('ResidentialGroup', 'residentialGroupId'),
      weekStart: a.date().required(), // Montag der Woche
      weekEnd: a.date().required(),   // Sonntag der Woche
      year: a.integer().required(),
      weekNumber: a.integer().required(),
      status: a.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    })
    .authorization((allow) => [allow.authenticated()])
    .secondaryIndexes((index) => [
      index('residentialGroupId').sortKeys(['weekStart']).queryField('weekPlansByGroup'),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
  logging: {
    fieldLogLevel: 'all',
    excludeVerboseContent: false,
    retention: '1 week',
  },
});