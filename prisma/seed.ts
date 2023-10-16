import {
  COUNTER_NUMBER_MAX,
  MENU_NUMBER_MAX,
  MONTHLY_DURATION,
  MONTHLY_PRICE,
  PLAN_ID,
  TABLE_NUMBER_MAX,
  TRIAL_COUNTER_NUMBER_MAX,
  TRIAL_DURATION,
  TRIAL_MENU_NUMBER_MAX,
  TRIAL_PRICE,
  TRIAL_TABLE_NUMBER_MAX,
  YEARLY_DURATION,
  YEARLY_PRICE,
} from "@/constants/plan";
import { upsertPlans } from "@/database/transactions";
import { CurrencyType, PlanType, PrismaClient } from "@prisma/client";
const seedPrisma = new PrismaClient();

async function main() {
  const plans = [
    {
      id: PLAN_ID.TRIAL_PLAN,
      planType: PlanType.FREE_TRIAL,
      name: "Try riding Oi-POS",
      description: "90-Day Free Trial",
      maxMenus: TRIAL_MENU_NUMBER_MAX,
      maxTables: TRIAL_TABLE_NUMBER_MAX + TRIAL_COUNTER_NUMBER_MAX,
      price: TRIAL_PRICE,
      currency: CurrencyType.USD,
      duration: TRIAL_DURATION,
    },
    {
      id: PLAN_ID.MONTHLY_PLAN,
      planType: PlanType.MONTHLY,
      name: "Have fun with Oi-POS every month",
      description: "Monthly Paid",
      maxMenus: MENU_NUMBER_MAX,
      maxTables: TABLE_NUMBER_MAX + COUNTER_NUMBER_MAX,
      price: MONTHLY_PRICE,
      currency: CurrencyType.USD,
      duration: MONTHLY_DURATION,
    },
    {
      id: PLAN_ID.YEARLY_PLAN,
      planType: PlanType.YEARLY,
      name: "Oi-POS is your friend every year!",
      description: "1 Year Paid",
      maxMenus: MENU_NUMBER_MAX,
      maxTables: TABLE_NUMBER_MAX + COUNTER_NUMBER_MAX,
      price: YEARLY_PRICE,
      currency: CurrencyType.USD,
      duration: YEARLY_DURATION,
    },
  ];

  const createPlansResult = await upsertPlans(plans);
  // log result
  console.log("Success create plans: ", createPlansResult);
}

main()
  .catch((err) => {
    // send error to sentry
    console.log(err);
    process.exit(1);
  })
  .finally(() => seedPrisma.$disconnect());
