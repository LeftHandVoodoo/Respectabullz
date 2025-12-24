// Database module index
// Re-exports all database operations for backwards compatibility

// Core connection and utilities
export { getDatabase, closeDatabase, query, execute, transaction, isDatabaseInitialized, isDatabaseEmpty } from './connection';
export { setupDatabase, initializeDatabase, runMigrations, getSchemaVersion } from './migrations';
export { generateId, dateToSql, sqlToDate, boolToSql, sqlToBool, nowIso } from './utils';
export * from './legacy';

// Dog operations
export {
  getDogs,
  getDog,
  getDogBasic,
  getDogsByIds,
  createDog,
  updateDog,
  deleteDog,
  getDogPhotos,
  createDogPhoto,
  deleteDogPhoto,
  setPrimaryDogPhoto,
  getPedigreeEntries,
  upsertPedigreeEntry,
  deletePedigreeEntry,
  deletePedigreeEntriesForDog,
} from './dogs';

// Litter operations
export {
  getLitters,
  getLitter,
  createLitter,
  updateLitter,
  deleteLitter,
  getLitterPhotos,
  getLitterPhoto,
  createLitterPhoto,
  updateLitterPhoto,
  deleteLitterPhoto,
  reorderLitterPhotos,
} from './litters';

// Health operations
export {
  getVaccinations,
  createVaccination,
  updateVaccination,
  deleteVaccination,
  getWeightEntries,
  createWeightEntry,
  updateWeightEntry,
  deleteWeightEntry,
  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getGeneticTests,
  getGeneticTest,
  createGeneticTest,
  updateGeneticTest,
  deleteGeneticTest,
  getPuppyHealthTasks,
  getPuppyHealthTask,
  createPuppyHealthTask,
  updatePuppyHealthTask,
  deletePuppyHealthTask,
  completePuppyHealthTask,
  uncompletePuppyHealthTask,
  deletePuppyHealthTasksForLitter,
  getPuppyHealthTasksDueThisWeek,
  getOverduePuppyHealthTasks,
  getHealthScheduleTemplates,
  getHealthScheduleTemplate,
  getDefaultHealthScheduleTemplate,
  createHealthScheduleTemplate,
  updateHealthScheduleTemplate,
  deleteHealthScheduleTemplate,
} from './health';

// Breeding operations
export {
  getHeatCycles,
  getHeatCycle,
  createHeatCycle,
  updateHeatCycle,
  deleteHeatCycle,
  getHeatEvents,
  createHeatEvent,
  updateHeatEvent,
  deleteHeatEvent,
  getExternalStuds,
  getExternalStud,
  createExternalStud,
  updateExternalStud,
  deleteExternalStud,
  getBreedingRecommendation,
  calculateHeatCyclePrediction,
} from './breeding';

// Sales operations
export {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  addPuppyToSale,
  removePuppyFromSale,
  updatePuppyPrice,
  getClientInterests,
  getClientInterest,
  getInterestsByClient,
  getInterestsByDog,
  createClientInterest,
  updateClientInterest,
  deleteClientInterest,
  convertInterestToSale,
  getWaitlistEntries,
  getGeneralWaitlist,
  getWaitlistEntry,
  getWaitlistEntriesByClient,
  createWaitlistEntry,
  updateWaitlistEntry,
  deleteWaitlistEntry,
  reorderWaitlist,
  matchPuppyToWaitlist,
  convertWaitlistToSale,
} from './sales';

// Operations (expenses, transport, communication)
export {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getTransports,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
  getCommunicationLogs,
  getCommunicationLog,
  getFollowUpsDue,
  getOverdueFollowUps,
  createCommunicationLog,
  updateCommunicationLog,
  deleteCommunicationLog,
  completeFollowUp,
} from './operations';

// Expense categories operations
export {
  getExpenseCategories,
  getExpenseCategory,
  getExpenseCategoryByName,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseCategory as DbExpenseCategory,
  type CreateExpenseCategoryInput,
  type UpdateExpenseCategoryInput,
} from './expenseCategories';

// Settings operations
export {
  getSetting,
  setSetting,
  getSettings,
  deleteSetting,
  getBreederSettings,
  saveBreederSettings,
  isFirstLaunch,
} from './settings';

// Dashboard operations
export {
  getDashboardStats,
  getRecentActivity,
  getFinancialSummary,
  getBreedingStats,
} from './dashboard';

// Contacts operations
export {
  getContacts,
  getContact,
  getContactsByCategory,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getContactCategories,
  getContactCategory,
  getContactCategoryByName,
  createContactCategory,
  updateContactCategory,
  deleteContactCategory,
  getCategoriesForContact,
  setContactCategories,
  addCategoryToContact,
  removeCategoryFromContact,
} from './contacts';

// Legacy/compatibility functions
export * from './legacy';

