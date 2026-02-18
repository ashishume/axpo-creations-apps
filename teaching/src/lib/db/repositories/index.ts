import { isTeachingApiConfigured } from '../../api/client';
import { authRepositoryApi } from '../api/auth';
import { organizationsRepositoryApi } from '../api/organizations';
import { rolesRepositoryApi } from '../api/roles';
import { schoolsRepositoryApi } from '../api/schools';
import { sessionsRepositoryApi } from '../api/sessions';
import { classesRepositoryApi } from '../api/classes';
import { studentsRepositoryApi } from '../api/students';
import { staffRepositoryApi } from '../api/staff';
import { expensesRepositoryApi } from '../api/expenses';
import { stocksRepositoryApi } from '../api/stocks';
import { fixedCostsRepositoryApi } from '../api/fixedCosts';

import { authRepository as authRepositorySupabase } from './auth';
import { organizationsRepository as organizationsRepositorySupabase } from './organizations';
import { rolesRepository as rolesRepositorySupabase } from './roles';
import { schoolsRepository as schoolsRepositorySupabase, type PaginatedResult } from './schools';
import { sessionsRepository as sessionsRepositorySupabase } from './sessions';
import { classesRepository as classesRepositorySupabase } from './classes';
import { studentsRepository as studentsRepositorySupabase } from './students';
import { staffRepository as staffRepositorySupabase, type ExtendedSalaryPayment } from './staff';
import { expensesRepository as expensesRepositorySupabase } from './expenses';
import { stocksRepository as stocksRepositorySupabase } from './stocks';
import { fixedCostsRepository as fixedCostsRepositorySupabase } from './fixedCosts';

const useApi = isTeachingApiConfigured();

export const authRepository = useApi ? authRepositoryApi : authRepositorySupabase;
export const organizationsRepository = useApi ? organizationsRepositoryApi : organizationsRepositorySupabase;
export const rolesRepository = useApi ? rolesRepositoryApi : rolesRepositorySupabase;
export const schoolsRepository = useApi ? schoolsRepositoryApi : schoolsRepositorySupabase;
export const sessionsRepository = useApi ? sessionsRepositoryApi : sessionsRepositorySupabase;
export const classesRepository = useApi ? classesRepositoryApi : classesRepositorySupabase;
export const studentsRepository = useApi ? studentsRepositoryApi : studentsRepositorySupabase;
export const staffRepository = useApi ? staffRepositoryApi : staffRepositorySupabase;
export const expensesRepository = useApi ? expensesRepositoryApi : expensesRepositorySupabase;
export const stocksRepository = useApi ? stocksRepositoryApi : stocksRepositorySupabase;
export const fixedCostsRepository = useApi ? fixedCostsRepositoryApi : fixedCostsRepositorySupabase;

export type { PaginatedResult, ExtendedSalaryPayment };
