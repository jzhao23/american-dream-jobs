/**
 * Manager Category Redistribution
 *
 * Maps management occupations (SOC 11-XXXX) to domain-specific categories
 * based on the "genealogical principle" - where did this manager get promoted from?
 *
 * ## The Genealogical Principle
 *
 * Managers are categorized based on their typical promotion path:
 * - Sales Manager → promoted from Sales Reps → goes in `sales`
 * - IT Manager → promoted from Software Developers → goes in `technology`
 * - Construction Manager → promoted from Construction Workers → goes in `construction`
 *
 * ## What Stays in "management"?
 *
 * Pure executive and cross-functional roles with no clear feeder occupation:
 * - C-suite executives (CEO, CSO)
 * - General operations managers
 * - Administrative/facilities management
 * - Regulatory/compliance management
 *
 * @see https://www.bls.gov/soc/2018/major_groups.htm#11-0000
 */

import type { CategoryId } from './onet-category-mapping';

/**
 * Maps specific management O*NET codes to their domain categories.
 * If a code is not in this map, it defaults to 'management'.
 */
export const MANAGER_TO_CATEGORY: Record<string, CategoryId> = {
  // =========================================================================
  // BUSINESS & FINANCE (9 occupations)
  // Promoted from business operations specialists (SOC 13-XXXX)
  // =========================================================================
  '11-2021.00': 'business-finance', // Marketing Managers ← marketing analysts (13-1161)
  '11-2033.00': 'business-finance', // Fundraising Managers ← fundraisers (13-1131)
  '11-3031.00': 'business-finance', // Financial Managers ← financial analysts (13-2051)
  '11-3031.01': 'business-finance', // Treasurers and Controllers ← accountants (13-2011)
  '11-3031.03': 'business-finance', // Investment Fund Managers ← financial analysts (13-2051)
  '11-3061.00': 'business-finance', // Purchasing Managers ← purchasing agents (13-1020)
  '11-3111.00': 'business-finance', // Compensation and Benefits Managers ← HR specialists (13-1141)
  '11-3121.00': 'business-finance', // Human Resources Managers ← HR specialists (13-1071)
  '11-3131.00': 'business-finance', // Training and Development Managers ← training specialists (13-1151)

  // =========================================================================
  // SALES (1 occupation)
  // Promoted from sales representatives (SOC 41-XXXX)
  // =========================================================================
  '11-2022.00': 'sales', // Sales Managers ← sales reps (41-XXXX)

  // =========================================================================
  // ARTS & MEDIA (2 occupations)
  // Promoted from creative/communications specialists (SOC 27-XXXX)
  // =========================================================================
  '11-2011.00': 'arts-media', // Advertising and Promotions Managers ← advertising specialists (27-3000)
  '11-2032.00': 'arts-media', // Public Relations Managers ← PR specialists (27-3031)

  // =========================================================================
  // TRANSPORTATION (2 occupations)
  // Promoted from logistics/transportation workers (SOC 53-XXXX)
  // =========================================================================
  '11-3071.00': 'transportation', // Transportation, Storage, and Distribution Managers
  '11-3071.04': 'transportation', // Supply Chain Managers

  // =========================================================================
  // TECHNOLOGY (1 occupation)
  // Promoted from IT professionals (SOC 15-XXXX)
  // =========================================================================
  '11-3021.00': 'technology', // Computer and Information Systems Managers

  // =========================================================================
  // ENGINEERING (7 occupations)
  // Promoted from engineers and energy technicians (SOC 17-XXXX)
  // =========================================================================
  '11-9041.00': 'engineering', // Architectural and Engineering Managers
  '11-9041.01': 'engineering', // Biofuels/Biodiesel Technology and Product Development Managers
  '11-3051.02': 'engineering', // Geothermal Production Managers
  '11-3051.03': 'engineering', // Biofuels Production Managers
  '11-3051.06': 'engineering', // Hydroelectric Production Managers
  '11-9199.09': 'engineering', // Wind Energy Operations Managers
  '11-9199.10': 'engineering', // Wind Energy Development Managers

  // =========================================================================
  // HEALTHCARE - CLINICAL (2 occupations)
  // Promoted from clinical healthcare workers (SOC 29-1XXX)
  // =========================================================================
  '11-9111.00': 'healthcare-clinical', // Medical and Health Services Managers
  '11-9121.01': 'healthcare-clinical', // Clinical Research Coordinators

  // =========================================================================
  // EDUCATION (4 occupations)
  // Promoted from educators (SOC 25-XXXX)
  // =========================================================================
  '11-9031.00': 'education', // Education and Childcare Administrators, Preschool and Daycare
  '11-9032.00': 'education', // Education Administrators, Kindergarten through Secondary
  '11-9033.00': 'education', // Education Administrators, Postsecondary
  '11-9039.00': 'education', // Education Administrators, All Other

  // =========================================================================
  // CONSTRUCTION (1 occupation)
  // Promoted from construction workers (SOC 47-XXXX)
  // =========================================================================
  '11-9021.00': 'construction', // Construction Managers

  // =========================================================================
  // AGRICULTURE (1 occupation)
  // Promoted from agricultural workers (SOC 45-XXXX)
  // =========================================================================
  '11-9013.00': 'agriculture', // Farmers, Ranchers, and Other Agricultural Managers

  // =========================================================================
  // FOOD SERVICE (1 occupation)
  // Promoted from food service workers (SOC 35-XXXX)
  // =========================================================================
  '11-9051.00': 'food-service', // Food Service Managers

  // =========================================================================
  // SCIENCE (2 occupations)
  // Promoted from scientists (SOC 19-XXXX)
  // =========================================================================
  '11-9121.00': 'science', // Natural Sciences Managers
  '11-9121.02': 'science', // Water Resource Specialists

  // =========================================================================
  // SOCIAL SERVICES (1 occupation)
  // Promoted from social workers (SOC 21-XXXX)
  // =========================================================================
  '11-9151.00': 'social-services', // Social and Community Service Managers

  // =========================================================================
  // PROTECTIVE SERVICES (1 occupation)
  // Promoted from security personnel (SOC 33-XXXX)
  // =========================================================================
  '11-3013.01': 'protective-services', // Security Managers
};

/**
 * List of O*NET codes that STAY in 'management' category.
 * These are pure executive/cross-functional roles with no clear feeder occupation.
 *
 * This list is for documentation purposes - codes not in MANAGER_TO_CATEGORY
 * automatically default to 'management'.
 */
export const PURE_MANAGEMENT_CODES = [
  // Executive & General Management
  '11-1011.00', // Chief Executives
  '11-1011.03', // Chief Sustainability Officers
  '11-1021.00', // General and Operations Managers
  '11-1031.00', // Legislators

  // Administrative & Facilities
  '11-3012.00', // Administrative Services Managers
  '11-3013.00', // Facilities Managers
  '11-9131.00', // Postmasters and Mail Superintendents

  // Hospitality, Entertainment, Property
  '11-9071.00', // Gambling Managers
  '11-9072.00', // Entertainment and Recreation Managers
  '11-9081.00', // Lodging Managers
  '11-9141.00', // Property, Real Estate, and Community Association Managers

  // Industrial/Production Management
  '11-3051.00', // Industrial Production Managers
  '11-3051.01', // Quality Control Systems Managers
  '11-3051.04', // Biomass Power Plant Managers

  // Regulatory & Compliance
  '11-9161.00', // Emergency Management Directors
  '11-9199.01', // Regulatory Affairs Managers
  '11-9199.02', // Compliance Managers
  '11-9199.08', // Loss Prevention Managers

  // Personal & Other Services
  '11-9171.00', // Funeral Home Managers
  '11-9179.00', // Personal Service Managers, All Other
  '11-9179.01', // Fitness and Wellness Coordinators
  '11-9179.02', // Spa Managers
  '11-9199.00', // Managers, All Other
  '11-9199.11', // Brownfield Redevelopment Specialists and Site Managers
] as const;
